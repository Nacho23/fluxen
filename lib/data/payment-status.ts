import type { PaymentStatus } from "@/lib/prisma/enums-public";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING_SIGNATURE: "Pendiente de firma",
  SIGNED: "Firmado",
};
