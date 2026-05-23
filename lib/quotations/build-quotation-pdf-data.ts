import { listQuotationCustomFieldsForCompany } from "@/lib/data/quotation-custom-fields";
import { SERVICE_ITEM_TYPE_LABEL } from "@/lib/data/service-item-type";
import type { QuotationDetail } from "@/lib/data/quotations";
import { effectiveQuotationClientNotes } from "@/lib/data/quotations";
import type { ServiceItemType } from "@/lib/data/service-item-type";
import { formatDateLongUtc } from "@/lib/dates/format-utc";
import type { QuotationPdfData } from "@/lib/quotations/quotation-pdf-types";
import { resolveCompanyLogoUrlForPdf } from "@/lib/quotations/resolve-company-logo-url";
import { vatIncludedInTotal } from "@/lib/quotations/vat";
import {
  formatCustomFieldValueForDisplay,
  parseStoredCustomFieldValues,
} from "@/lib/quotations/custom-field-values";

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

export type CompanyForQuotationPdf = {
  id: string;
  name: string;
  businessName: string | null;
  rut: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  logoStorageKey: string | null;
};

export async function buildQuotationPdfData(
  q: QuotationDetail,
  company: CompanyForQuotationPdf,
): Promise<QuotationPdfData> {
  const definitions = await listQuotationCustomFieldsForCompany(q.companyId);
  const serviceDateLabel = formatDateLongUtc(q.serviceDate);
  const lines = q.lines.map((line) => ({
    name: line.name,
    description: line.description,
    itemTypeLabel: typeLabel(line.itemType),
    unitPrice: fmtMoney(line.unitPrice),
    quantity: fmtQty(line.quantity),
    lineTotal: fmtMoney(line.lineTotal),
  }));

  const stored = parseStoredCustomFieldValues(q.customFieldValues);
  const customFieldRows =
    definitions.length === 0
      ? undefined
      : definitions.flatMap((d) => {
          const disp = formatCustomFieldValueForDisplay(d.fieldType, stored[d.id]);
          if (disp === "—") return [];
          return [{ id: d.id, label: d.label, value: disp }];
        });

  const logoUrl = await resolveCompanyLogoUrlForPdf(company);

  return {
    title: q.title ?? null,
    company: {
      name: company.name,
      businessName: company.businessName,
      rut: company.rut,
      address: company.address,
      phone: company.phone,
      email: company.email,
      website: company.website,
      city: company.city,
      country: company.country,
      logoUrl,
    },
    quoteNumber: q.quoteNumber,
    serviceDateLabel,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientPhone: q.clientPhone,
    clientNotes: effectiveQuotationClientNotes(q),
    customFieldRows:
      customFieldRows && customFieldRows.length > 0 ? customFieldRows : undefined,
    lines,
    subtotal: fmtMoney(q.subtotal),
    discountMode: q.discountMode,
    discountLabel: discountLabel(q.discountMode, q.discountValue),
    discountAmount: fmtMoney(q.discountAmount),
    vatChargedSeparately: q.vatChargedSeparately,
    vatAmount: fmtMoney(q.vatAmount),
    vatIncludedAmount: !q.vatChargedSeparately
      ? fmtMoney(vatIncludedInTotal(Number(q.total.toString())))
      : undefined,
    total: fmtMoney(q.total),
  };
}
