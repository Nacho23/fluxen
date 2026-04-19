/** MIME sin parámetros (charset, etc.) — el navegador a veces envía `tipo; charset=binary`. */
export function normalizeMimeType(mime: string): string {
  const m = mime.trim().toLowerCase();
  if (!m) return "";
  return m.split(";")[0].trim();
}

/** Tipos permitidos por MIME (lista + prefijos). */
export function isAllowedUploadMime(mime: string): boolean {
  const m = normalizeMimeType(mime);
  if (!m) return false;
  if (m.startsWith("image/")) return true;
  if (m.startsWith("video/")) return true;
  if (m.startsWith("audio/")) return true;
  const allow = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "text/tab-separated-values",
    "application/json",
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",
  ]);
  if (allow.has(m)) return true;
  // Variantes Office (macro, binario, etc.) que no coinciden con la lista fija
  if (m.startsWith("application/vnd.ms-excel")) return true;
  if (m.startsWith("application/vnd.openxmlformats-officedocument.spreadsheet")) return true;
  if (m.startsWith("application/vnd.oasis.opendocument.spreadsheet")) return true;
  return false;
}

const EXT_FALLBACK = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".dot",
  ".dotx",
  ".xls",
  ".xlsx",
  ".xlsm",
  ".xlsb",
  ".xltx",
  ".ppt",
  ".pptx",
  ".csv",
  ".tsv",
  ".txt",
  ".rtf",
  ".ods",
  ".odt",
  ".odp",
  ".json",
]);

function extensionLower(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "");
  const i = base.lastIndexOf(".");
  if (i < 0) return "";
  return base.slice(i).toLowerCase();
}

/**
 * Valida subida usando MIME y, si hace falta, la extensión del nombre.
 * Excel a veces llega como `application/zip` (xlsx es un zip), `application/octet-stream`
 * o MIME con parámetros que antes no coincidían con la lista.
 */
export function isAllowedDocumentUpload(filename: string, mime: string): boolean {
  if (isAllowedUploadMime(mime)) return true;
  const ext = extensionLower(filename);
  if (!ext || !EXT_FALLBACK.has(ext)) return false;
  const m = normalizeMimeType(mime);
  if (m === "" || m === "application/octet-stream" || m === "application/x-download" || m === "binary/octet-stream") {
    return true;
  }
  if (m === "application/zip" || m === "application/x-zip-compressed") {
    return [".xlsx", ".docx", ".pptx", ".ods", ".odt", ".odp"].includes(ext);
  }
  if (m.startsWith("application/vnd.")) return true;
  if (m.startsWith("text/")) return true;
  return false;
}
