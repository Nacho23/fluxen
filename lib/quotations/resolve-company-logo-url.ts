import { brandingImageSrc } from "@/lib/branding/branding-image-src";
import { isR2Configured, presignGetObjectInline } from "@/lib/storage/r2";

function contentTypeFromKey(key: string): string {
  const k = key.toLowerCase();
  if (k.endsWith(".png")) return "image/png";
  if (k.endsWith(".webp")) return "image/webp";
  if (k.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function safeExternalImageUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

type CompanyLogoFields = {
  id: string;
  logoUrl: string | null;
  logoStorageKey: string | null;
};

/** URL usable por @react-pdf (servidor: firma R2; cliente: ruta autenticada de la API). */
export async function resolveCompanyLogoUrlForPdf(
  company: CompanyLogoFields,
  options?: { forBrowserPreview?: boolean },
): Promise<string | null> {
  const hasR2 = Boolean(company.logoStorageKey?.trim());
  if (options?.forBrowserPreview) {
    return brandingImageSrc(company.id, "logo", hasR2, company.logoUrl);
  }

  if (hasR2 && company.logoStorageKey && isR2Configured()) {
    try {
      return await presignGetObjectInline(
        company.logoStorageKey,
        contentTypeFromKey(company.logoStorageKey),
      );
    } catch {
      return null;
    }
  }

  return safeExternalImageUrl(company.logoUrl);
}
