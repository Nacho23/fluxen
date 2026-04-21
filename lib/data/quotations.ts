import type { Prisma, Quotation } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { QuotationStatus } from "@/lib/data/quotation-status";

export type QuotationListRow = {
  id: string;
  quoteNumber: string;
  serviceDate: Date;
  clientName: string;
  total: string;
  status: QuotationStatus;
  emailSent: boolean;
  emailSentAt: Date | null;
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
      emailSent: true,
      emailSentAt: true,
      createdAt: true,
    },
    take: 100,
  });
  return rows.map((r) => ({
    ...r,
    total: r.total.toString(),
  }));
}

const quotationDetailInclude = {
  lines: { orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }] },
  company: { select: { name: true as const } },
  /** Correo actual del cliente (la cotización guarda copia en `clientEmail`, que puede quedar vacía si luego se edita la ficha). */
  client: { select: { email: true as const } },
} satisfies Prisma.QuotationInclude;

type QuotationDetailPayload = Prisma.QuotationGetPayload<{
  include: typeof quotationDetailInclude;
}>;

/** Escalares del modelo + relaciones (evita inferencias incompletas de `GetPayload` en algunos entornos). */
export type QuotationDetail = Quotation & Pick<
  QuotationDetailPayload,
  "lines" | "company" | "client"
>;

/** Correo para UI y envío: copia en la cotización, o si falta, el de la ficha del cliente vinculada. */
export function effectiveQuotationClientEmail(q: QuotationDetail): string | null {
  const snap = q.clientEmail?.trim();
  if (snap) return snap;
  const live = q.client?.email?.trim();
  return live && live.length > 0 ? live : null;
}

export type QuotationDetailLine = QuotationDetail["lines"][number];

export async function getQuotationForCompany(
  id: string,
  companyId: string,
): Promise<QuotationDetail | null> {
  const row = await prisma.quotation.findFirst({
    where: { id, companyId },
    include: quotationDetailInclude,
  });
  return row as QuotationDetail | null;
}
