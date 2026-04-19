/**
 * Contraseña inicial para usuarios creados al añadirlos a una empresa:
 * parte local del correo + "1234" (ej. admin@mail.com → admin1234).
 */
export function defaultPasswordFromEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) {
    return "1234";
  }
  return `${email.slice(0, at)}1234`;
}
