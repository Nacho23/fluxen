import { getServerSession } from "next-auth";
import { createElement } from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";

import {
  QuotationPdfPage,
  type QuotationPdfDocumentProps,
} from "@/components/cotizaciones/quotation-pdf-document";
import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { SERVICE_ITEM_TYPE_LABEL } from "@/lib/data/service-item-type";
import { formatDateLongUtc } from "@/lib/dates/format-utc";
import type { ServiceItemType } from "@/lib/data/service-item-type";
import { getQuotationForCompany } from "@/lib/data/quotations";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtMoney(value: { toString(): string }): string {
  return priceFmt.format(Number(value.toString()));
}

function fmtQty(value: { toString(): string }): string {
  const n = Number(value.toString());
  if (Number.isNaN(n)) return value.toString();
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/\.?0+$/, "");
}

function typeLabel(t: ServiceItemType | null): string | null {
  if (t == null) return null;
  return SERVICE_ITEM_TYPE_LABEL[t];
}

function discountLabel(
  mode: "NONE" | "PERCENT" | "FIXED",
  raw: { toString(): string } | null,
): string {
  if (mode === "PERCENT" && raw) {
    return `Descuento (${Number(raw.toString())}%)`;
  }
  if (mode === "FIXED") {
    return "Descuento";
  }
  return "Descuento";
}

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId) {
    return new Response("No autorizado", { status: 401 });
  }
  const ok = await sessionHasPermission(session, "cotizaciones", "read");
  if (!ok) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await context.params;
  const q = await getQuotationForCompany(id, session.activeCompanyId);
  if (!q) {
    return new Response("No encontrado", { status: 404 });
  }

  const serviceDateLabel = formatDateLongUtc(q.serviceDate);
  const lines = q.lines.map((line) => ({
    name: line.name,
    description: line.description,
    itemTypeLabel: typeLabel(line.itemType),
    unitPrice: fmtMoney(line.unitPrice),
    quantity: fmtQty(line.quantity),
    lineTotal: fmtMoney(line.lineTotal),
  }));

  const pdfProps: QuotationPdfDocumentProps = {
    companyName: q.company.name,
    quoteNumber: q.quoteNumber,
    serviceDateLabel,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientPhone: q.clientPhone,
    lines,
    subtotal: fmtMoney(q.subtotal),
    discountMode: q.discountMode,
    discountLabel: discountLabel(q.discountMode, q.discountValue),
    discountAmount: fmtMoney(q.discountAmount),
    total: fmtMoney(q.total),
  };

  const buffer = await renderToBuffer(
    createElement(Document, null, createElement(QuotationPdfPage, pdfProps)),
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cotizacion-${q.quoteNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
