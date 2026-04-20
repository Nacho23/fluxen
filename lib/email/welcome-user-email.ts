import { escapeHtml } from "@/lib/email/escape-html";

export type WelcomeUserEmailParams = {
  /** Nombre para saludo */
  displayName: string;
  userEmail: string;
  plainPassword: string;
  companyName: string;
  roleLabel: string;
  loginUrl: string;
};

function loginOrigin(): string {
  const base = process.env.NEXTAUTH_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function buildWelcomeUserLoginUrl(): string {
  return `${loginOrigin()}/login`;
}

export function buildWelcomeUserEmailContent(
  p: WelcomeUserEmailParams,
): { subject: string; html: string } {
  const name = escapeHtml(p.displayName);
  const email = escapeHtml(p.userEmail);
  const pass = escapeHtml(p.plainPassword);
  const company = escapeHtml(p.companyName);
  const role = escapeHtml(p.roleLabel);
  const loginEsc = escapeHtml(p.loginUrl);

  const subject = `Tu acceso a ${p.companyName}`;

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
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Nueva cuenta</p>
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;line-height:1.3;">${company}</h1>
              <p style="margin:12px 0 0 0;font-size:15px;color:#cbd5e1;">Te han dado acceso a la plataforma</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#334155;">Hola <strong style="color:#0f172a;">${name}</strong>,</p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#475569;">Tu usuario fue creado y quedó asociado a <strong style="color:#0f172a;">${company}</strong> con el rol de <strong style="color:#0f172a;">${role}</strong>. Usa los datos de abajo para iniciar sesión.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 24px 0;border-radius:10px;background-color:#f8fafc;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:0 0 8px 0;font-size:13px;color:#64748b;">Correo (usuario)</td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 16px 0;font-size:15px;font-weight:600;color:#0f172a;font-family:ui-monospace,monospace;word-break:break-all;border-bottom:1px solid #e2e8f0;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0 8px 0;font-size:13px;color:#64748b;">Contraseña temporal</td>
                      </tr>
                      <tr>
                        <td style="padding:0;font-size:16px;font-weight:700;color:#0c4a6e;font-family:ui-monospace,monospace;letter-spacing:0.02em;">${pass}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;color:#64748b;">Por seguridad, <strong style="color:#334155;">cambia esta contraseña</strong> en cuanto entres: menú <strong>Perfil</strong> → actualizar contraseña (o equivalente en tu cuenta).</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background-color:#2563eb;">
                    <a href="${p.loginUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Ir al inicio de sesión</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Si el botón no abre, copia esta URL:<br /><span style="word-break:break-all;color:#64748b;">${loginEsc}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;">No compartas este correo. Si no esperabas esta invitación, ignora el mensaje o contacta a quien administra ${company}.</p>
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
