/** Formatea una fecha almacenada en calendario UTC (sin hora local del usuario). */
export function formatDateLongUtc(date: Date, locale = "es-CL"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Fecha y hora en zona local del servidor / navegador (p. ej. “último envío de correo”). */
export function formatDateTimeShortLocal(date: Date, locale = "es-CL"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
