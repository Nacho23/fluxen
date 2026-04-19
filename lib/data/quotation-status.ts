export const QUOTATION_STATUS_LABEL = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
} as const;

/** Valores del enum `QuotationStatus` en Prisma (alias estable sin depender de exports duplicados en `@prisma/client`). */
export type QuotationStatus = keyof typeof QUOTATION_STATUS_LABEL;
