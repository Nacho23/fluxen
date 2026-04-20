import { createElement } from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";

import {
  QuotationPdfPage,
  type QuotationPdfDocumentProps,
} from "@/components/cotizaciones/quotation-pdf-document";
import { SERVICE_ITEM_TYPE_LABEL } from "@/lib/data/service-item-type";
import { formatDateLongUtc } from "@/lib/dates/format-utc";
import type { QuotationDetail } from "@/lib/data/quotations";
import type { ServiceItemType } from "@/lib/data/service-item-type";

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

function quotationToPdfProps(q: QuotationDetail): QuotationPdfDocumentProps {
  const serviceDateLabel = formatDateLongUtc(q.serviceDate);
  const lines = q.lines.map((line) => ({
    name: line.name,
    description: line.description,
    itemTypeLabel: typeLabel(line.itemType),
    unitPrice: fmtMoney(line.unitPrice),
    quantity: fmtQty(line.quantity),
    lineTotal: fmtMoney(line.lineTotal),
  }));

  return {
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
}

/** Genera el PDF de cotización en memoria (misma salida que la ruta `/api/quotations/[id]/pdf`). */
export async function renderQuotationPdfBuffer(
  q: QuotationDetail,
): Promise<Buffer> {
  const pdfProps = quotationToPdfProps(q);
  const buffer = await renderToBuffer(
    createElement(Document, null, createElement(QuotationPdfPage, pdfProps)),
  );
  return Buffer.from(buffer);
}

export function quotationPdfAttachmentFilename(q: QuotationDetail): string {
  const safe = q.quoteNumber.replace(/[^\w.-]+/g, "-").slice(0, 64) || "cotizacion";
  return `cotizacion-${safe}.pdf`;
}
