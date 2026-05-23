import type { QuoteDiscountMode } from "@/lib/prisma/enums-public";

export type QuotationPdfLine = {
  name: string;
  description: string | null;
  itemTypeLabel: string | null;
  unitPrice: string;
  quantity: string;
  lineTotal: string;
};

export type QuotationPdfCompanyInfo = {
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
};

export type QuotationPdfData = {
  company: QuotationPdfCompanyInfo;
  quoteNumber: string;
  /** Título opcional de la cotización (se muestra debajo del número/fecha). */
  title?: string | null;
  serviceDateLabel: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientNotes?: string | null;
  customFieldRows?: { id: string; label: string; value: string }[];
  lines: QuotationPdfLine[];
  subtotal: string;
  discountMode: QuoteDiscountMode;
  discountLabel: string;
  discountAmount: string;
  vatChargedSeparately: boolean;
  vatAmount: string;
  /** Monto de IVA incluido en el total (solo informativo cuando no se cobra aparte). */
  vatIncludedAmount?: string;
  total: string;
};
