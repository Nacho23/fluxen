/**
 * Comprueba que DATABASE_URL sea una URI PostgreSQL con host creíble.
 * Devuelve la cadena recortada (evita espacios/saltos típicos del .env).
 */
export function parseAndValidatePostgresUrl(raw: string): string {
  const connectionString = raw.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL está vacía");
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(
      "DATABASE_URL no es una URL válida. Si la contraseña tiene @, # u otros caracteres, usa la cadena que Neon copia tal cual o codifica la contraseña en la URL.",
    );
  }

  const scheme = url.protocol.replace(":", "").toLowerCase();
  if (scheme !== "postgresql" && scheme !== "postgres") {
    throw new Error("DATABASE_URL debe empezar por postgresql:// o postgres://");
  }

  const host = url.hostname;
  if (!host) {
    throw new Error(
      "DATABASE_URL no incluye el servidor (host). Copia la URI completa desde Neon (Connection string).",
    );
  }

  // Placeholder típico de ejemplos mal pegados
  if (host === "base") {
    throw new Error(
      "El host de DATABASE_URL es «base»: no es un servidor real. Copia la URI completa desde Neon (Dashboard → tu proyecto → Connection details). Debe verse algo como ep-xxxx.region.aws.neon.tech, no la palabra «base».",
    );
  }

  return connectionString;
}
