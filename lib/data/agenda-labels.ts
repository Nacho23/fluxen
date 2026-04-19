import type { AgendaEventSource } from "@/lib/prisma/enums-public";

export const AGENDA_SOURCE_LABEL: Record<AgendaEventSource, string> = {
  MANUAL: "Evento",
  QUOTATION: "Cotización aceptada",
};

export const ATTENDANCE_LABEL = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptó",
  DECLINED: "Rechazó",
} as const;
