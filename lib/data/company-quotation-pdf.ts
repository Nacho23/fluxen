import { prisma } from "@/lib/db/prisma";

import type { CompanyForQuotationPdf } from "@/lib/quotations/build-quotation-pdf-data";

const select = {
  id: true,
  name: true,
  businessName: true,
  rut: true,
  address: true,
  phone: true,
  email: true,
  website: true,
  city: true,
  country: true,
  logoUrl: true,
  logoStorageKey: true,
} as const;

export async function getCompanyForQuotationPdf(
  companyId: string,
): Promise<CompanyForQuotationPdf | null> {
  return prisma.company.findUnique({
    where: { id: companyId },
    select,
  });
}

export type CompanyForTemplateBuilder = CompanyForQuotationPdf;

export async function getCompanyForTemplateBuilder(
  companyId: string,
): Promise<CompanyForTemplateBuilder | null> {
  return getCompanyForQuotationPdf(companyId);
}
