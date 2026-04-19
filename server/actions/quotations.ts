"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma, QuoteDiscountMode } from "@prisma/client";

import type { QuotationStatus } from "@/lib/data/quotation-status";
import type { ServiceItemType } from "@/lib/data/service-item-type";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import {
  computeQuotationTotals,
  lineTotal,
  roundMoney,
  snapQuantity,
} from "@/lib/quotations/compute-totals";
import { syncAgendaFromQuotationStatus } from "@/lib/agenda/sync-from-quotation";
import { prisma } from "@/lib/db/prisma";

async function requireCotizacionAction(action: "create" | "update") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "cotizaciones", action);
  if (!ok) {
    throw new Error("No tienes permiso para gestionar cotizaciones");
  }
  return { session, companyId: session.activeCompanyId };
}

const lineSchema = z.object({
  serviceId: z.string().nullable().optional(),
  name: z.string().trim().min(1, "Cada línea debe tener nombre").max(200),
  description: z.string().max(5000).optional().nullable(),
  itemType: z.enum(["SERVICIO", "PRODUCTO"]).optional(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().positive(),
});

const createSchema = z.object({
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  clientId: z.string().min(1, "Selecciona un cliente"),
  discountMode: z.nativeEnum(QuoteDiscountMode),
  discountValue: z.number().nonnegative().nullable().optional(),
  lines: z.array(lineSchema).min(1, "Añade al menos una línea"),
});

function parseItemType(v: ServiceItemType | undefined): ServiceItemType | null {
  return v ?? null;
}

export async function createQuotation(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireCotizacionAction("create");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const parts = parsed.data.serviceDate.split("-").map((x) => Number(x));
    const [y, mo, d] = parts;
    if (!y || !mo || !d || mo > 12 || d > 31) {
      return { ok: false, error: "Fecha del servicio no válida" };
    }
    const serviceDate = new Date(Date.UTC(y, mo - 1, d));
    if (Number.isNaN(serviceDate.getTime())) {
      return { ok: false, error: "Fecha del servicio no válida" };
    }

    let discountMode = parsed.data.discountMode;
    let discountValueNum = parsed.data.discountValue ?? null;
    if (discountMode === "NONE") {
      discountValueNum = null;
    }
    if (discountMode === "PERCENT" && discountValueNum != null && discountValueNum > 100) {
      discountValueNum = 100;
    }

    const serviceIds = parsed.data.lines
      .map((l) => l.serviceId)
      .filter((id): id is string => id != null && id !== "");
    if (serviceIds.length > 0) {
      const count = await prisma.service.count({
        where: { companyId, id: { in: [...new Set(serviceIds)] } },
      });
      if (count !== new Set(serviceIds).size) {
        return { ok: false, error: "Un ítem del catálogo no pertenece a esta empresa" };
      }
    }

    const id = await prisma.$transaction(async (tx) => {
      const client = await tx.companyClient.findFirst({
        where: { id: parsed.data.clientId, companyId },
      });
      if (!client) {
        throw new Error("Cliente no encontrado o no pertenece a esta empresa");
      }

      const company = await tx.company.update({
        where: { id: companyId },
        data: { lastQuoteSequence: { increment: 1 } },
        select: {
          lastQuoteSequence: true,
          quoteCodePrefix: true,
          quoteCodePadding: true,
        },
      });

      const prefix = company.quoteCodePrefix.trim() || "COT";
      const pad = Math.min(12, Math.max(3, company.quoteCodePadding));
      const quoteNumber = `${prefix}-${String(company.lastQuoteSequence).padStart(pad, "0")}`;

      const lineTotals: Prisma.Decimal[] = [];
      const lineCreates: Prisma.QuotationLineUncheckedCreateWithoutQuotationInput[] = [];

      parsed.data.lines.forEach((line, index) => {
        const unitPrice = roundMoney(new Prisma.Decimal(line.unitPrice));
        const quantity = snapQuantity(new Prisma.Decimal(line.quantity));
        const lt = lineTotal(unitPrice, quantity);
        lineTotals.push(lt);
        lineCreates.push({
          serviceId: line.serviceId && line.serviceId !== "" ? line.serviceId : null,
          name: line.name,
          description: line.description?.trim() || null,
          itemType: parseItemType(line.itemType),
          unitPrice,
          quantity,
          lineTotal: lt,
          sortOrder: index + 1,
        });
      });

      const discountDec =
        discountMode === "NONE" || discountValueNum == null || discountValueNum === 0
          ? null
          : roundMoney(new Prisma.Decimal(discountValueNum));

      const { subtotal, discountAmount, total } = computeQuotationTotals(
        lineTotals,
        discountMode,
        discountDec,
      );

      const quotation = await tx.quotation.create({
        data: {
          companyId,
          quoteNumber,
          sequence: company.lastQuoteSequence,
          serviceDate,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email?.trim() || null,
          clientPhone: client.phone?.trim() || null,
          discountMode,
          discountValue: discountDec,
          subtotal,
          discountAmount,
          total,
          status: "DRAFT",
          lines: { create: lineCreates },
        },
        select: { id: true },
      });

      return quotation.id;
    });

    revalidatePath("/cotizaciones");
    revalidatePath(`/cotizaciones/${id}`);
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear la cotización";
    return { ok: false, error: msg };
  }
}

const updateStatusSchema = z.object({
  quotationId: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

const FINAL_STATUSES: QuotationStatus[] = ["ACCEPTED", "REJECTED", "EXPIRED"];

export async function updateQuotationStatus(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, session } = await requireCotizacionAction("update");
    const parsed = updateStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const row = await prisma.quotation.findFirst({
      where: { id: parsed.data.quotationId, companyId },
      select: { status: true },
    });
    if (!row) {
      return { ok: false, error: "Cotización no encontrada" };
    }
    if (FINAL_STATUSES.includes(row.status)) {
      return {
        ok: false,
        error: "No se puede cambiar el estado: la cotización ya está cerrada o vencida.",
      };
    }

    await prisma.quotation.update({
      where: { id: parsed.data.quotationId },
      data: { status: parsed.data.status },
    });

    await syncAgendaFromQuotationStatus({
      quotationId: parsed.data.quotationId,
      companyId,
      newStatus: parsed.data.status,
      actorUserId: session.user.id,
    });

    revalidatePath("/cotizaciones");
    revalidatePath(`/cotizaciones/${parsed.data.quotationId}`);
    revalidatePath("/agenda");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar el estado";
    return { ok: false, error: msg };
  }
}
