import { createElement } from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";

import { QuotationPdfFromTemplate } from "@/components/cotizaciones/quotation-pdf-from-template";
import { getCompanyForQuotationPdf } from "@/lib/data/company-quotation-pdf";
import { getQuotationTemplateLayoutForCompany } from "@/lib/data/quotation-templates";
import type { QuotationDetail } from "@/lib/data/quotations";
import { buildQuotationPdfData } from "@/lib/quotations/build-quotation-pdf-data";

/** Genera el PDF de cotización en memoria (misma salida que la ruta `/api/quotations/[id]/pdf`). */
export async function renderQuotationPdfBuffer(
  q: QuotationDetail,
): Promise<Buffer> {
  const [company, layout] = await Promise.all([
    getCompanyForQuotationPdf(q.companyId),
    getQuotationTemplateLayoutForCompany(q.companyId, q.templateId),
  ]);
  if (!company) {
    throw new Error("Empresa no encontrada");
  }

  const data = await buildQuotationPdfData(q, company);
  const buffer = await renderToBuffer(
    createElement(
      Document,
      null,
      createElement(QuotationPdfFromTemplate, { layout, data }),
    ),
  );
  return Buffer.from(buffer);
}

export function quotationPdfAttachmentFilename(q: QuotationDetail): string {
  const safe = q.quoteNumber.replace(/[^\w.-]+/g, "-").slice(0, 64) || "cotizacion";
  return `cotizacion-${safe}.pdf`;
}
