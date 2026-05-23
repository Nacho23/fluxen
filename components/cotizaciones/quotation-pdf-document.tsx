import {
  QuotationPdfDocumentFromTemplate,
  QuotationPdfFromTemplate,
} from "@/components/cotizaciones/quotation-pdf-from-template";
import type { QuotationPdfData, QuotationPdfLine } from "@/lib/quotations/quotation-pdf-types";
import { defaultQuotationTemplateLayout } from "@/lib/quotations/template-schema";

export type { QuotationPdfLine };

/** Props históricas; el PDF real usa la plantilla guardada por empresa. */
export type QuotationPdfDocumentProps = QuotationPdfData & {
  companyName: string;
};

function legacyPropsToData(props: QuotationPdfDocumentProps): QuotationPdfData {
  const {
    companyName,
    quoteNumber,
    serviceDateLabel,
    clientName,
    clientEmail,
    clientPhone,
    customFieldRows,
    lines,
    subtotal,
    discountMode,
    discountLabel,
    discountAmount,
    vatChargedSeparately,
    vatAmount,
    total,
  } = props;
  return {
    company: {
      name: companyName,
      businessName: null,
      rut: null,
      address: null,
      phone: null,
      email: null,
      website: null,
      city: null,
      country: null,
      logoUrl: null,
    },
    quoteNumber,
    serviceDateLabel,
    clientName,
    clientEmail,
    clientPhone,
    customFieldRows,
    lines,
    subtotal,
    discountMode,
    discountLabel,
    discountAmount,
    vatChargedSeparately: vatChargedSeparately ?? false,
    vatAmount: vatAmount ?? "—",
    total,
  };
}

/** Una página A4 con layout por defecto (compatibilidad). */
export function QuotationPdfPage(props: Readonly<QuotationPdfDocumentProps>) {
  const layout = defaultQuotationTemplateLayout();
  const data = legacyPropsToData(props);
  return <QuotationPdfFromTemplate layout={layout} data={data} />;
}

export function QuotationPdfDocument(props: Readonly<QuotationPdfDocumentProps>) {
  return <QuotationPdfPage {...props} />;
}
