/** Quita puntos y espacios; deja body + guion + DV en mayúsculas (ej. 12345678-5). */
export function normalizeRutInput(raw: string): string {
  return raw.replace(/\./g, "").replace(/\s/g, "").toUpperCase();
}

/** Valida RUT chileno (cuerpo numérico + dígito verificador 0-9 o K). */
export function isValidChileRut(raw: string): boolean {
  const s = normalizeRutInput(raw);
  const m = /^(\d{7,8})-([\dkK])$/.exec(s);
  if (!m) return false;
  const body = m[1];
  const dv = m[2].toUpperCase();

  let sum = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]!, 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const rest = 11 - (sum % 11);
  const expected = rest === 11 ? "0" : rest === 10 ? "K" : String(rest);
  return dv === expected;
}
