import { AgendaEventSource, type QuotationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const HOURS_DEFAULT = 2;

/**
 * Al aceptar una cotización se crea/actualiza un evento vinculado; si deja de estar aceptada, se elimina.
 */
export async function syncAgendaFromQuotationStatus(params: {
  quotationId: string;
  companyId: string;
  newStatus: QuotationStatus;
  actorUserId: string;
}): Promise<void> {
  const { quotationId, companyId, newStatus, actorUserId } = params;

  if (newStatus === "ACCEPTED") {
    const q = await prisma.quotation.findFirst({
      where: { id: quotationId, companyId },
      select: { id: true, quoteNumber: true, clientName: true, serviceDate: true },
    });
    if (!q) return;

    const startAt = q.serviceDate;
    const endAt = new Date(startAt.getTime() + HOURS_DEFAULT * 60 * 60 * 1000);

    await prisma.agendaEvent.upsert({
      where: { quotationId: q.id },
      create: {
        companyId,
        title: `${q.quoteNumber} · ${q.clientName}`,
        description: "Trabajo o visita según cotización aceptada.",
        location: null,
        startAt,
        endAt,
        source: AgendaEventSource.QUOTATION,
        quotationId: q.id,
        createdByUserId: actorUserId,
      },
      update: {
        title: `${q.quoteNumber} · ${q.clientName}`,
        startAt,
        endAt,
      },
    });
    return;
  }

  await prisma.agendaEvent.deleteMany({ where: { quotationId } });
}
