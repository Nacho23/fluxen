import { Prisma } from "@prisma/client";

import type { QuoteDiscountMode } from "@/lib/prisma/enums-public";

export function roundMoney(d: Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(d.toFixed(2));
}

/** Cantidad con hasta 4 decimales (coincide con DB). */
export function snapQuantity(d: Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(d.toFixed(4));
}

export function lineTotal(unitPrice: Prisma.Decimal, quantity: Prisma.Decimal): Prisma.Decimal {
  return roundMoney(unitPrice.mul(quantity));
}

export function computeQuotationTotals(
  lineTotals: Prisma.Decimal[],
  discountMode: QuoteDiscountMode,
  discountValue: Prisma.Decimal | null,
): {
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  total: Prisma.Decimal;
} {
  let subtotal = new Prisma.Decimal(0);
  for (const lt of lineTotals) {
    subtotal = subtotal.add(lt);
  }
  subtotal = roundMoney(subtotal);

  let discountAmount = new Prisma.Decimal(0);
  if (discountMode === "PERCENT" && discountValue && discountValue.gt(0)) {
    const p = discountValue.gt(100) ? new Prisma.Decimal(100) : discountValue;
    discountAmount = roundMoney(subtotal.mul(p).div(100));
  } else if (discountMode === "FIXED" && discountValue && discountValue.gt(0)) {
    discountAmount = discountValue.gt(subtotal) ? subtotal : roundMoney(discountValue);
  }

  const total = roundMoney(subtotal.sub(discountAmount));
  return { subtotal, discountAmount, total };
}
