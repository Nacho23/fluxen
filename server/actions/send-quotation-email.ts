"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { effectiveQuotationClientEmail, getQuotationForCompany } from "@/lib/data/quotations";
import { prisma } from "@/lib/db/prisma";
import { buildQuotationEmailContent } from "@/lib/email/quotation-email";
import { sendTransactionalEmail } from "@/lib/email/resend-send";
import {
  quotationPdfAttachmentFilename,
  renderQuotationPdfBuffer,
} from "@/lib/quotations/render-quotation-pdf";

/** Envío de cotización por correo al cliente (Resend). */
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

  const to = effectiveQuotationClientEmail(q);
  if (!to) {
    return {
      ok: false,
      error:
        "No hay correo en esta cotización ni en la ficha del cliente vinculado. Añádelo en Clientes o en una cotización nueva.",
    };
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderQuotationPdfBuffer(q);
  } catch {
    return {
      ok: false,
      error: "No se pudo generar el PDF de la cotización. Intenta de nuevo.",
    };
  }

  const { subject, html } = buildQuotationEmailContent(q);
  const sessionEmail = session.user.email?.trim();
  const sent = await sendTransactionalEmail({
    to,
    subject,
    html,
    attachments: [
      {
        filename: quotationPdfAttachmentFilename(q),
        content: pdfBuffer,
      },
    ],
    ...(sessionEmail ? { replyTo: sessionEmail } : {}),
  });

  if (!sent.ok) {
    return { ok: false, error: sent.error };
  }

  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      emailSent: true,
      emailSentAt: new Date(),
    },
  });

  return {
    ok: true,
    message: `Correo enviado a ${to} con PDF adjunto.`,
  };
}
