import type { QuotationStatus } from "@/lib/data/quotation-status";

/** Estados en los que ya no tiene sentido pedir “respuesta del cliente” en el mismo sentido operativo. */
const TERMINAL_CLIENT_RESPONSE: QuotationStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
];

/**
 * Cotización enviada por correo pero el estado aún no refleja decisión del cliente
 * (aceptada / rechazada / vencida).
 */
export function isPendingClientConfirmationAfterEmail(params: {
  emailSent: boolean;
  status: QuotationStatus;
}): boolean {
  return (
    params.emailSent && !TERMINAL_CLIENT_RESPONSE.includes(params.status)
  );
}
