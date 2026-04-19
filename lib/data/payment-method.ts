import type { PaymentMethod } from "@prisma/client";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CHECK: "Cheque",
  CARD: "Tarjeta / POS",
  OTHER: "Otro",
};
