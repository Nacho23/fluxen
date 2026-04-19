import type { PaymentMethod } from "@/lib/prisma/enums-public";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CHECK: "Cheque",
  CARD: "Tarjeta / POS",
  OTHER: "Otro",
};
