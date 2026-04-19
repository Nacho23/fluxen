import type { PaymentStatus } from "@prisma/client";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING_SIGNATURE: "Pendiente de firma",
  SIGNED: "Firmado",
};
