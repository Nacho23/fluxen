"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { getQuotationForCompany } from "@/lib/data/quotations";

/**
 * Envío de cotización por correo al cliente.
 * Pendiente: integrar proveedor (Resend, SMTP, etc.) y plantilla HTML/PDF adjunto.
 */
export async function sendQuotationEmail(
  quotationId: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    return { ok: false, error: "No autorizado" };
  }
  const ok = await sessionHasPermission(session, "cotizaciones", "read");
  if (!ok) {
    return { ok: false, error: "No tienes permiso" };
  }

  const companyId = session.activeCompanyId;
  const q = await getQuotationForCompany(quotationId, companyId);
  if (!q) {
    return { ok: false, error: "Cotización no encontrada" };
  }

  const to = q.clientEmail?.trim();
  if (!to) {
    return { ok: false, error: "Esta cotización no tiene correo del cliente. Añádelo en la ficha del cliente." };
  }

  // TODO: enviar correo real a `to` con enlace o PDF adjunto.
  return {
    ok: true,
    message: `Listo para enviar a ${to} cuando conectes el proveedor de correo.`,
  };
}
