import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { QuotationStatus } from "@/lib/data/quotation-status";

export type QuotationListRow = {
  id: string;
  quoteNumber: string;
  serviceDate: Date;
  clientName: string;
  total: string;
  status: QuotationStatus;
  createdAt: Date;
};

export async function listQuotationsForCompany(
  companyId: string,
): Promise<QuotationListRow[]> {
  const rows = await prisma.quotation.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      quoteNumber: true,
      serviceDate: true,
      clientName: true,
      total: true,
      status: true,
      createdAt: true,
    },
    take: 100,
  });
  return rows.map((r) => ({
    ...r,
    total: r.total.toString(),
  }));
}

const quotationDetailArgs = {
  include: {
    lines: { orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }] },
    company: { select: { name: true as const } },
  },
} satisfies Prisma.QuotationFindFirstArgs;

export type QuotationDetail = Prisma.QuotationGetPayload<typeof quotationDetailArgs>;

export type QuotationDetailLine = QuotationDetail["lines"][number];

export async function getQuotationForCompany(
  id: string,
  companyId: string,
): Promise<QuotationDetail | null> {
  return prisma.quotation.findFirst({
    where: { id, companyId },
    ...quotationDetailArgs,
  });
}
