/**
 * @deprecated Las invitaciones de empresa usan {@link generateSecureInvitePassword}.
 * Se mantiene por compatibilidad si algún script externo lo importaba.
 *
 * Contraseña débil basada en el correo (solo referencia histórica).
 */
export function defaultPasswordFromEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) {
    return "1234";
  }
  return `${email.slice(0, at)}1234`;
}
