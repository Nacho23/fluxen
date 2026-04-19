import type { AgendaAttendanceStatus, AgendaEventSource } from "@/lib/prisma/enums-public";

import { prisma } from "@/lib/db/prisma";

export type AgendaEventListItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  source: AgendaEventSource;
  quotationId: string | null;
  createdByUserId: string;
  createdByName: string;
  attendeeCount: number;
  pendingCount: number;
};

/** Cotizaciones aceptadas sin fila de evento (histórico antes de esta función o sin sync). */
export type LegacyAcceptedQuotationItem = {
  kind: "legacy_quotation";
  id: string;
  quoteNumber: string;
  clientName: string;
  serviceDate: string;
  total: string;
};

export type AgendaMergedRow =
  | { kind: "event"; event: AgendaEventListItem }
  | LegacyAcceptedQuotationItem;

function eventRow(
  e: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startAt: Date;
    endAt: Date;
    source: AgendaEventSource;
    quotationId: string | null;
    createdByUserId: string;
    createdBy: { name: string };
    attendees: { status: AgendaAttendanceStatus }[];
  },
): AgendaEventListItem {
  const pendingCount = e.attendees.filter((a) => a.status === "PENDING").length;
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    source: e.source,
    quotationId: e.quotationId,
    createdByUserId: e.createdByUserId,
    createdByName: e.createdBy.name,
    attendeeCount: e.attendees.length,
    pendingCount,
  };
}

export async function getAgendaEventsInRange(
  companyId: string,
  from: Date,
  to: Date,
): Promise<AgendaEventListItem[]> {
  /** Solapamiento con [from, to): empieza antes de que termine el rango y termina después de que empiece. */
  const rows = await prisma.agendaEvent.findMany({
    where: {
      companyId,
      startAt: { lt: to },
      endAt: { gt: from },
    },
    include: {
      createdBy: { select: { name: true } },
      attendees: { select: { status: true } },
    },
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
  });
  return rows.map(eventRow);
}

export async function getMergedAgendaRows(
  companyId: string,
  from: Date,
  to: Date,
): Promise<AgendaMergedRow[]> {
  const events = await getAgendaEventsInRange(companyId, from, to);
  const linkedQuoteIds = new Set(
    events.map((e) => e.quotationId).filter((id): id is string => id != null),
  );

  const legacyWhere =
    linkedQuoteIds.size === 0
      ? {
          companyId,
          status: "ACCEPTED" as const,
          serviceDate: { gte: from, lt: to },
        }
      : {
          companyId,
          status: "ACCEPTED" as const,
          serviceDate: { gte: from, lt: to },
          id: { notIn: [...linkedQuoteIds] },
        };

  const legacy = await prisma.quotation.findMany({
    where: legacyWhere,
    select: {
      id: true,
      quoteNumber: true,
      clientName: true,
      serviceDate: true,
      total: true,
    },
    orderBy: [{ serviceDate: "asc" }, { id: "asc" }],
  });

  const legacyRows: LegacyAcceptedQuotationItem[] = legacy.map((q) => ({
    kind: "legacy_quotation" as const,
    id: q.id,
    quoteNumber: q.quoteNumber,
    clientName: q.clientName,
    serviceDate: q.serviceDate.toISOString(),
    total: q.total.toString(),
  }));

  const merged: AgendaMergedRow[] = [
    ...events.map((event) => ({ kind: "event" as const, event })),
    ...legacyRows,
  ];

  merged.sort((a, b) => {
    const ta =
      a.kind === "event" ? a.event.startAt : a.serviceDate;
    const tb =
      b.kind === "event" ? b.event.startAt : b.serviceDate;
    return ta.localeCompare(tb);
  });

  return merged;
}

export type AgendaEventDetail = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  source: AgendaEventSource;
  quotationId: string | null;
  quoteNumber: string | null;
  createdByUserId: string;
  createdByName: string;
  attendees: {
    id: string;
    userId: string;
    name: string;
    email: string;
    status: AgendaAttendanceStatus;
    respondedAt: string | null;
  }[];
};

export async function getAgendaEventForCompany(
  eventId: string,
  companyId: string,
): Promise<AgendaEventDetail | null> {
  const e = await prisma.agendaEvent.findFirst({
    where: { id: eventId, companyId },
    include: {
      createdBy: { select: { name: true } },
      quotation: { select: { quoteNumber: true } },
      attendees: {
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
      },
    },
  });
  if (!e) return null;

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    source: e.source,
    quotationId: e.quotationId,
    quoteNumber: e.quotation?.quoteNumber ?? null,
    createdByUserId: e.createdByUserId,
    createdByName: e.createdBy.name,
    attendees: e.attendees.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.user.name,
      email: a.user.email,
      status: a.status,
      respondedAt: a.respondedAt?.toISOString() ?? null,
    })),
  };
}

export async function getAttendanceForUser(
  eventId: string,
  userId: string,
): Promise<{ id: string; status: AgendaAttendanceStatus } | null> {
  const row = await prisma.agendaAttendance.findFirst({
    where: { eventId, userId },
    select: { id: true, status: true },
  });
  return row;
}

export async function findAgendaEventIdForQuotation(
  quotationId: string,
  companyId: string,
): Promise<string | null> {
  const row = await prisma.agendaEvent.findFirst({
    where: { quotationId, companyId },
    select: { id: true },
  });
  return row?.id ?? null;
}
