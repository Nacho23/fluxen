import { brandingImageSrc } from "@/lib/branding/branding-image-src";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function resolveFetchUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const absolute = `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  if (absolute.includes("/api/company-branding/")) {
    return absolute.includes("?") ? `${absolute}&embed=1` : `${absolute}?embed=1`;
  }
  return absolute;
}

/**
 * Descarga el logo de la empresa (API autenticada o URL externa) como data URL
 * para que @react-pdf pueda incrustarlo en el navegador.
 */
export async function fetchCompanyLogoDataUrl(
  companyId: string,
  hasR2: boolean,
  externalLogoUrl: string | null,
): Promise<string | null> {
  const path = brandingImageSrc(companyId, "logo", hasR2, externalLogoUrl);
  if (!path) return null;

  const fetchUrl = resolveFetchUrl(path);

  try {
    const res = await fetch(fetchUrl, { credentials: "include", redirect: "follow" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size || !blob.type.startsWith("image/")) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}
