/**
 * URL para `<img src>`: objeto en R2 vía API (firma al pedir) o URL externa guardada.
 */
export function brandingImageSrc(
  companyId: string,
  kind: "cover" | "avatar" | "logo",
  hasR2: boolean,
  externalUrl: string | null | undefined,
): string | null {
  if (hasR2) {
    return `/api/company-branding/${companyId}/${kind}`;
  }
  const u = externalUrl?.trim();
  return u && u.length > 0 ? u : null;
}
