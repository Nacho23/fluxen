import { normalizeMimeType } from "@/lib/documentos/mime";

const ALLOW = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isAllowedBrandingImageUpload(filename: string, mime: string): boolean {
  const m = normalizeMimeType(mime);
  if (ALLOW.has(m)) return true;
  const ext = filename.replace(/^.*[/\\]/, "").toLowerCase();
  const i = ext.lastIndexOf(".");
  const suf = i >= 0 ? ext.slice(i) : "";
  if (suf === ".jpg" || suf === ".jpeg") return m === "" || m === "application/octet-stream";
  if (suf === ".png" && (m === "" || m === "application/octet-stream")) return true;
  if (suf === ".webp" && (m === "" || m === "application/octet-stream")) return true;
  if (suf === ".gif" && (m === "" || m === "application/octet-stream")) return true;
  return false;
}
