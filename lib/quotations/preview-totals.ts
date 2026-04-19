import type { QuoteDiscountMode } from "@prisma/client";

export function previewLineTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}

export function previewQuotationTotals(
  lineTotals: number[],
  discountMode: QuoteDiscountMode,
  discountValue: number | null,
): { subtotal: number; discountAmount: number; total: number } {
  let subtotal = 0;
  for (const lt of lineTotals) {
    subtotal += lt;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  let discountAmount = 0;
  if (discountMode === "PERCENT" && discountValue != null && discountValue > 0) {
    const p = discountValue > 100 ? 100 : discountValue;
    discountAmount = Math.round(subtotal * (p / 100) * 100) / 100;
  } else if (discountMode === "FIXED" && discountValue != null && discountValue > 0) {
    discountAmount = discountValue > subtotal ? subtotal : Math.round(discountValue * 100) / 100;
  }

  const total = Math.round((subtotal - discountAmount) * 100) / 100;
  return { subtotal, discountAmount, total };
}
