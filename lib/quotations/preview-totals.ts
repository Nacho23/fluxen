import type { QuoteDiscountMode } from "@/lib/prisma/enums-public";
import { QUOTATION_VAT_RATE } from "@/lib/quotations/vat";

export function previewLineTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}

export function previewQuotationTotals(
  lineTotals: number[],
  discountMode: QuoteDiscountMode,
  discountValue: number | null,
  vatChargedSeparately = false,
): {
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
} {
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

  const net = Math.round((subtotal - discountAmount) * 100) / 100;
  let vatAmount = 0;
  let total = net;
  if (vatChargedSeparately) {
    vatAmount = Math.round(net * QUOTATION_VAT_RATE * 100) / 100;
    total = Math.round((net + vatAmount) * 100) / 100;
  }

  return { subtotal, discountAmount, vatAmount, total };
}
