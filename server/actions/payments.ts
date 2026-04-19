"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { PaymentMethod } from "@/lib/prisma/enums-public";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { roundMoney } from "@/lib/quotations/compute-totals";
import { prisma } from "@/lib/db/prisma";

async function requireSessionWithCompany() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  return { session, companyId: session.activeCompanyId, userId: session.user.id };
}

async function requirePaymentRegistrar() {
  const ctx = await requireSessionWithCompany();
  const ok = await sessionHasPermission(ctx.session, "pagos", "create");
  if (!ok) {
    throw new Error("No tienes permiso para registrar pagos");
  }
  return ctx;
}

const createSchema = z.object({
  workerUserId: z.string().min(1, "Selecciona un trabajador"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  serviceDate: z.string().optional(),
  activityDescription: z.string().trim().min(1, "Describe la actividad").max(8000),
  amount: z.number().nonnegative("El monto no puede ser negativo"),
  tip: z.number().nonnegative("La propina no puede ser negativa"),
  transactionCode: z.string().trim().max(200).optional().nullable(),
});

export async function createPayment(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requirePaymentRegistrar();
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const { workerUserId, paymentMethod, activityDescription, amount, tip, transactionCode } =
      parsed.data;

    const member = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: { userId: workerUserId, companyId },
      },
      select: { userId: true },
    });
    if (!member) {
      return { ok: false, error: "El trabajador no pertenece a esta empresa" };
    }

    let serviceDate: Date | null = null;
    const sd = parsed.data.serviceDate?.trim();
    if (sd) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sd)) {
        return { ok: false, error: "Fecha del servicio no válida" };
      }
      const parts = sd.split("-").map((x) => Number(x));
      const [y, mo, d] = parts;
      if (!y || !mo || !d || mo > 12 || d > 31) {
        return { ok: false, error: "Fecha del servicio no válida" };
      }
      serviceDate = new Date(Date.UTC(y, mo - 1, d));
      if (Number.isNaN(serviceDate.getTime())) {
        return { ok: false, error: "Fecha del servicio no válida" };
      }
    }

    const amountDec = roundMoney(new Prisma.Decimal(amount));
    const tipDec = roundMoney(new Prisma.Decimal(tip));
    const totalDec = roundMoney(amountDec.add(tipDec));

    const row = await prisma.payment.create({
      data: {
        companyId,
        workerUserId,
        recordedByUserId: userId,
        paymentMethod,
        serviceDate,
        activityDescription,
        amount: amountDec,
        tip: tipDec,
        total: totalDec,
        transactionCode: transactionCode?.trim() ? transactionCode.trim() : null,
      },
      select: { id: true },
    });

    revalidatePath("/pagos");
    revalidatePath(`/pagos/${row.id}`);
    return { ok: true, id: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear el pago";
    return { ok: false, error: msg };
  }
}

export async function signPayment(
  paymentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requireSessionWithCompany();

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      select: {
        id: true,
        workerUserId: true,
        status: true,
      },
    });
    if (!payment) {
      return { ok: false, error: "Pago no encontrado" };
    }
    if (payment.workerUserId !== userId) {
      return { ok: false, error: "Solo el trabajador beneficiario puede firmar este pago" };
    }
    if (payment.status !== "PENDING_SIGNATURE") {
      return { ok: false, error: "Este pago ya fue confirmado" };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signedByUserId: userId,
      },
    });

    revalidatePath("/pagos");
    revalidatePath(`/pagos/${paymentId}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al firmar";
    return { ok: false, error: msg };
  }
}
