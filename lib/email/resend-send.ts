import { Resend } from "resend";

/**
 * Remitente por defecto de Resend (solo pruebas). En producción define `RESEND_FROM`
 * con un dominio verificado, p. ej. `Fluxen <cotizaciones@tudominio.com>`.
 */
const DEFAULT_FROM = "Cotizaciones <onboarding@resend.dev>";

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export function resendFromAddress(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
}

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = resendClient();
  if (!resend) {
    return {
      ok: false,
      error:
        "No está configurado RESEND_API_KEY. Añádelo en .env (local) o en las variables del servicio (Railway, etc.).",
    };
  }

  const attachments = options.attachments?.length
    ? options.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }))
    : undefined;

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    ...(attachments ? { attachments } : {}),
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.id) {
    return { ok: false, error: "Respuesta inesperada del proveedor de correo." };
  }
  return { ok: true, id: data.id };
}
