import { escapeHtml } from "@/lib/email/escape-html";

export type WorkOrderAssignedEmailParams = {
  workerName: string;
  companyName: string;
  orderNumber: string;
  title: string;
  detailUrl: string;
};

function appOrigin(): string {
  const base = process.env.NEXTAUTH_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function buildWorkOrderDetailUrl(workOrderId: string): string {
  return `${appOrigin()}/ordenes/${workOrderId}`;
}

export function buildWorkOrderAssignedEmailContent(
  p: WorkOrderAssignedEmailParams,
): { subject: string; html: string } {
  const name = escapeHtml(p.workerName);
  const company = escapeHtml(p.companyName);
  const number = escapeHtml(p.orderNumber);
  const title = escapeHtml(p.title);
  const url = escapeHtml(p.detailUrl);

  const subject = `Orden ${p.orderNumber} asignada — ${p.companyName}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 32px;">
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Orden de trabajo</p>
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;line-height:1.3;">${number}</h1>
              <p style="margin:12px 0 0 0;font-size:15px;color:#cbd5e1;">${company}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#334155;">Hola <strong style="color:#0f172a;">${name}</strong>,</p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#475569;">Te asignaron la orden <strong style="color:#0f172a;">${number}</strong>:</p>
              <p style="margin:0 0 24px 0;font-size:16px;font-weight:600;color:#0f172a;line-height:1.5;">${title}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background-color:#2563eb;">
                    <a href="${p.detailUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Ver orden</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Si el botón no abre, copia esta URL:<br /><span style="word-break:break-all;color:#64748b;">${url}</span></p>
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
