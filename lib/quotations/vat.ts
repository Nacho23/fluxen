/** Tasa de IVA Chile (cotizaciones). */
export const QUOTATION_VAT_RATE = 0.19;

/** Extrae el monto de IVA incluido en un total con IVA embebido (total × 19/119). */
export function vatIncludedInTotal(total: number): number {
  return Math.round(total * (19 / 119) * 100) / 100;
}
