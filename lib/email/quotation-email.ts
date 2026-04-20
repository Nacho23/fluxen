import { formatDateLongUtc } from "@/lib/dates/format-utc";
import type { QuotationDetail } from "@/lib/data/quotations";

import { escapeHtml } from "@/lib/email/escape-html";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatTotal(q: QuotationDetail): string {
  return priceFmt.format(Number(q.total.toString()));
}

export function buildQuotationEmailContent(q: QuotationDetail): {
  subject: string;
  html: string;
} {
  const company = escapeHtml(q.company.name);
  const client = escapeHtml(q.clientName);
  const number = escapeHtml(q.quoteNumber);
  const totalFormatted = escapeHtml(formatTotal(q));
  const serviceDate = formatDateLongUtc(q.serviceDate);
  const serviceDateEsc = escapeHtml(serviceDate);

  const subject = `Cotización ${q.quoteNumber} — ${q.company.name}`;

  const greeting = q.clientName
    ? `Hola <strong style="color:#0f172a;">${client}</strong>,`
    : `Hola,`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(`Cotización ${q.quoteNumber} — ${q.company.name}`)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 32px;">
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Cotización</p>
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;line-height:1.3;">${company}</h1>
              <p style="margin:12px 0 0 0;font-size:15px;color:#cbd5e1;">Documento <strong style="color:#fff;">${number}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#334155;">${greeting}</p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#475569;">Te enviamos la cotización con el detalle de ítems y montos en el <strong style="color:#0f172a;">PDF adjunto</strong>. Puedes descargarlo, imprimirlo o reenviarlo si lo necesitas.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-radius:10px;background-color:#f8fafc;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha de servicio (referencia)</td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 14px 0;font-size:15px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">${serviceDateEsc}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0 6px 0;font-size:13px;color:#64748b;">Total cotizado</td>
                      </tr>
                      <tr>
                        <td style="padding:0;font-size:20px;font-weight:700;color:#0c4a6e;letter-spacing:-0.02em;">${totalFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;">Este mensaje fue generado de forma automática. Para consultas, responde a este correo y llegará a quien te envió la cotización.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject, html };
}
