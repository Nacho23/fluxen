import { randomBytes } from "node:crypto";

/** Sin caracteres ambiguos (0/O, 1/l) para dictar por teléfono si hace falta. */
const CHARSET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Contraseña inicial aleatoria para usuarios nuevos invitados a una empresa. */
export function generateSecureInvitePassword(length = 14): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i]! % CHARSET.length];
  }
  return out;
}
