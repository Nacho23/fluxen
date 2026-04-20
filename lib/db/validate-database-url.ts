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
      "DATABASE_URL no es una URL válida. Si la contraseña tiene @, # u otros caracteres, codifícala en la URL o usa la cadena que te da tu proveedor (p. ej. Railway → Variables → DATABASE_URL).",
    );
  }

  const scheme = url.protocol.replace(":", "").toLowerCase();
  if (scheme !== "postgresql" && scheme !== "postgres") {
    throw new Error("DATABASE_URL debe empezar por postgresql:// o postgres://");
  }

  const host = url.hostname;
  if (!host) {
    throw new Error(
      "DATABASE_URL no incluye el servidor (host). Copia la URI completa de tu proveedor PostgreSQL (p. ej. Railway).",
    );
  }

  // Placeholder típico de ejemplos mal pegados
  if (host === "base") {
    throw new Error(
      "El host de DATABASE_URL es «base»: suele ser un placeholder sin reemplazar o una URL cortada. Usa el hostname real que te da tu proveedor (p. ej. *.railway.app o el host público del servicio Postgres).",
    );
  }

  return connectionString;
}
