"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { AgendaEventSource, WorkOrderStatus } from "@/lib/prisma/enums-public";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { canTransitionWorkOrderStatus } from "@/lib/data/work-order-status";
import { prisma } from "@/lib/db/prisma";
import { notifyWorkOrderAssigned } from "@/lib/notifications/work-order-assigned";

async function requireWorkOrderAction(action: "create" | "update" | "delete" | "read") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "ordenes", action);
  if (!ok) {
    throw new Error("No tienes permiso para gestionar órdenes de trabajo");
  }
  return { session, companyId: session.activeCompanyId, userId: session.user.id };
}

async function assertMember(companyId: string, userId: string | null | undefined): Promise<boolean> {
  if (!userId?.trim()) return true;
  const n = await prisma.companyMember.count({
    where: { companyId, userId },
  });
  return n > 0;
}

async function assertQuotationAvailable(
  companyId: string,
  quotationId: string | null | undefined,
  excludeWorkOrderId?: string,
): Promise<string | null> {
  if (!quotationId?.trim()) return null;
  const q = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    select: { id: true, workOrder: { select: { id: true } } },
  });
  if (!q) return "La cotización no existe en esta empresa";
  if (q.workOrder && q.workOrder.id !== excludeWorkOrderId) {
    return "Esa cotización ya tiene otra orden vinculada";
  }
  return null;
}

function parseOptionalDate(s: string | undefined): Date | null {
  const t = s?.trim();
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const parts = t.split("-").map((x) => Number(x));
  const [y, mo, d] = parts;
  if (!y || !mo || !d) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function resolveStatusOnAssign(
  assignedUserId: string | null | undefined,
  explicit?: WorkOrderStatus,
): WorkOrderStatus {
  if (explicit) return explicit;
  return assignedUserId ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.PENDING;
}

const createSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(200),
  description: z.string().max(8000).optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

export async function createWorkOrder(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requireWorkOrderAction("create");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const assignedUserId = parsed.data.assignedUserId?.trim() || null;
    const quotationId = parsed.data.quotationId?.trim() || null;

    if (!(await assertMember(companyId, assignedUserId))) {
      return { ok: false, error: "El trabajador no pertenece a esta empresa" };
    }
    const quoteErr = await assertQuotationAvailable(companyId, quotationId);
    if (quoteErr) return { ok: false, error: quoteErr };

    const scheduledAt = parseOptionalDate(parsed.data.scheduledAt ?? undefined);
    if (parsed.data.scheduledAt?.trim() && !scheduledAt) {
      return { ok: false, error: "Fecha programada no válida" };
    }

    const initialStatus = resolveStatusOnAssign(assignedUserId);
    const desc = parsed.data.description?.trim() || null;

    const HOURS_DEFAULT = 2;

    const row = await prisma.$transaction(async (tx) => {
      const company = await tx.company.update({
        where: { id: companyId },
        data: { lastWorkOrderSequence: { increment: 1 } },
        select: {
          lastWorkOrderSequence: true,
          workOrderCodePrefix: true,
          workOrderCodePadding: true,
        },
      });

      const prefix = company.workOrderCodePrefix.trim() || "OT";
      const pad = Math.min(12, Math.max(3, company.workOrderCodePadding));
      const orderNumber = `${prefix}-${String(company.lastWorkOrderSequence).padStart(pad, "0")}`;

      const eventStart = scheduledAt ?? new Date();
      const eventEnd = new Date(eventStart.getTime() + HOURS_DEFAULT * 60 * 60 * 1000);

      const agendaEvent = await tx.agendaEvent.create({
        data: {
          companyId,
          title: `${orderNumber} · ${parsed.data.title}`,
          startAt: eventStart,
          endAt: eventEnd,
          source: AgendaEventSource.WORK_ORDER,
          createdByUserId: userId,
        },
        select: { id: true },
      });

      const workOrder = await tx.workOrder.create({
        data: {
          companyId,
          orderNumber,
          sequence: company.lastWorkOrderSequence,
          title: parsed.data.title,
          description: desc,
          status: initialStatus,
          assignedUserId,
          agendaEventId: agendaEvent.id,
          quotationId,
          scheduledAt,
          createdByUserId: userId,
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: initialStatus,
              assignedUserId,
              note: "Orden creada",
              changedByUserId: userId,
            },
          },
        },
        select: { id: true, orderNumber: true, title: true },
      });

      return workOrder;
    });

    if (assignedUserId) {
      await notifyWorkOrderAssigned({
        companyId,
        workOrderId: row.id,
        orderNumber: row.orderNumber,
        title: row.title,
        assigneeUserId: assignedUserId,
      });
    }

    revalidatePath("/ordenes");
    revalidatePath(`/ordenes/${row.id}`);
    revalidatePath("/agenda");
    return { ok: true, id: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear la orden";
    return { ok: false, error: msg };
  }
}

const updateSchema = createSchema.extend({
  id: z.string().min(1),
});

export async function updateWorkOrder(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requireWorkOrderAction("update");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const existing = await prisma.workOrder.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!existing) {
      return { ok: false, error: "Orden no encontrada" };
    }
    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      return { ok: false, error: "No se puede editar una orden cerrada" };
    }

    const assignedUserId = parsed.data.assignedUserId?.trim() || null;
    const quotationId = parsed.data.quotationId?.trim() || null;

    if (!(await assertMember(companyId, assignedUserId))) {
      return { ok: false, error: "El trabajador no pertenece a esta empresa" };
    }
    const quoteErr = await assertQuotationAvailable(companyId, quotationId, existing.id);
    if (quoteErr) return { ok: false, error: quoteErr };

    const scheduledAt = parseOptionalDate(parsed.data.scheduledAt ?? undefined);
    if (parsed.data.scheduledAt?.trim() && !scheduledAt) {
      return { ok: false, error: "Fecha programada no válida" };
    }

    const desc = parsed.data.description?.trim() || null;
    const assigneeChanged = assignedUserId !== existing.assignedUserId;
    let nextStatus = existing.status;
    if (assigneeChanged) {
      if (assignedUserId && existing.status === "PENDING") {
        nextStatus = WorkOrderStatus.ASSIGNED;
      }
      if (!assignedUserId && existing.status === "ASSIGNED") {
        nextStatus = WorkOrderStatus.PENDING;
      }
    }

    const historyEntries: {
      fromStatus: WorkOrderStatus | null;
      toStatus: WorkOrderStatus;
      assignedUserId: string | null;
      note: string;
      changedByUserId: string;
    }[] = [];

    if (nextStatus !== existing.status) {
      historyEntries.push({
        fromStatus: existing.status,
        toStatus: nextStatus,
        assignedUserId,
        note: assigneeChanged ? "Cambio de asignación" : "Actualización de estado",
        changedByUserId: userId,
      });
    } else if (assigneeChanged) {
      historyEntries.push({
        fromStatus: existing.status,
        toStatus: existing.status,
        assignedUserId,
        note: assignedUserId ? "Trabajador asignado" : "Asignación removida",
        changedByUserId: userId,
      });
    }

    await prisma.workOrder.update({
      where: { id: existing.id },
      data: {
        title: parsed.data.title,
        description: desc,
        assignedUserId,
        quotationId,
        scheduledAt,
        status: nextStatus,
        ...(historyEntries.length
          ? {
              statusHistory: {
                createMany: { data: historyEntries },
              },
            }
          : {}),
      },
    });

    if (assigneeChanged && assignedUserId) {
      await notifyWorkOrderAssigned({
        companyId,
        workOrderId: existing.id,
        orderNumber: existing.orderNumber,
        title: parsed.data.title,
        assigneeUserId: assignedUserId,
      });
    }

    revalidatePath("/ordenes");
    revalidatePath(`/ordenes/${existing.id}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar la orden";
    return { ok: false, error: msg };
  }
}

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(WorkOrderStatus),
  note: z.string().max(2000).optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
});

export async function updateWorkOrderStatus(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requireWorkOrderAction("read");
    const parsed = statusSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const existing = await prisma.workOrder.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!existing) {
      return { ok: false, error: "Orden no encontrada" };
    }

    const toStatus = parsed.data.status;
    if (!canTransitionWorkOrderStatus(existing.status, toStatus)) {
      return { ok: false, error: "Transición de estado no permitida" };
    }

    let assignedUserId = existing.assignedUserId;
    if (parsed.data.assignedUserId !== undefined) {
      assignedUserId = parsed.data.assignedUserId?.trim() || null;
    } else if (toStatus === "ASSIGNED" && !assignedUserId) {
      return { ok: false, error: "Debes asignar un trabajador para este estado" };
    }

    if (!(await assertMember(companyId, assignedUserId))) {
      return { ok: false, error: "El trabajador no pertenece a esta empresa" };
    }

    if (toStatus === "PENDING") {
      assignedUserId = null;
    }

    const assigneeChanged = assignedUserId !== existing.assignedUserId;
    const statusChanged = toStatus !== existing.status;
    if (!statusChanged && !assigneeChanged) {
      return { ok: true };
    }

    const note = parsed.data.note?.trim() || null;
    const completedAt = toStatus === "COMPLETED" ? new Date() : null;

    await prisma.workOrder.update({
      where: { id: existing.id },
      data: {
        status: toStatus,
        assignedUserId,
        completedAt,
        statusHistory: {
          create: {
            fromStatus: existing.status,
            toStatus,
            assignedUserId,
            note: note ?? (statusChanged ? "Cambio de estado" : "Cambio de asignación"),
            changedByUserId: userId,
          },
        },
      },
    });

    if (assigneeChanged && assignedUserId) {
      await notifyWorkOrderAssigned({
        companyId,
        workOrderId: existing.id,
        orderNumber: existing.orderNumber,
        title: existing.title,
        assigneeUserId: assignedUserId,
      });
    }

    revalidatePath("/ordenes");
    revalidatePath(`/ordenes/${existing.id}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cambiar el estado";
    return { ok: false, error: msg };
  }
}

export async function deleteWorkOrder(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireWorkOrderAction("delete");
    const existing = await prisma.workOrder.findFirst({
      where: { id, companyId },
      select: { id: true, _count: { select: { payments: true } } },
    });
    if (!existing) {
      return { ok: false, error: "Orden no encontrada" };
    }
    if (existing._count.payments > 0) {
      return {
        ok: false,
        error: "No se puede eliminar: hay pagos vinculados. Desvincúlalos primero.",
      };
    }

    await prisma.workOrder.delete({ where: { id: existing.id } });
    revalidatePath("/ordenes");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar la orden";
    return { ok: false, error: msg };
  }
}
