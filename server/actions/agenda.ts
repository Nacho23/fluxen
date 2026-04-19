"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { AgendaAttendanceStatus } from "@/lib/prisma/enums-public";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { prisma } from "@/lib/db/prisma";

async function requireAgendaAction(action: "create" | "update" | "delete") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "agenda", action);
  if (!ok) {
    throw new Error("No tienes permiso para gestionar la agenda");
  }
  return { session, companyId: session.activeCompanyId, userId: session.user.id };
}

async function requireAgendaRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "agenda", "read");
  if (!ok) {
    throw new Error("No tienes permiso para ver la agenda");
  }
  return { session, companyId: session.activeCompanyId, userId: session.user.id };
}

const createSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(200),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  attendeeUserIds: z.array(z.string()).max(200),
});

function parseIsoDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function assertMembersOfCompany(companyId: string, userIds: string[]): Promise<boolean> {
  if (userIds.length === 0) return true;
  const unique = [...new Set(userIds)];
  const n = await prisma.companyMember.count({
    where: { companyId, userId: { in: unique } },
  });
  return n === unique.length;
}

export async function createAgendaEvent(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requireAgendaAction("create");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const startAt = parseIsoDate(parsed.data.startAt);
    const endAt = parseIsoDate(parsed.data.endAt);
    if (!startAt || !endAt || endAt <= startAt) {
      return { ok: false, error: "La fecha/hora de fin debe ser posterior al inicio." };
    }

    const attendees = [...new Set(parsed.data.attendeeUserIds)].filter((id) => id !== userId);
    const okMembers = await assertMembersOfCompany(companyId, attendees);
    if (!okMembers) {
      return { ok: false, error: "Uno o más asistentes no pertenecen a la empresa." };
    }

    const desc = parsed.data.description?.trim() || null;
    const loc = parsed.data.location?.trim() || null;

    const event = await prisma.agendaEvent.create({
      data: {
        companyId,
        title: parsed.data.title,
        description: desc,
        location: loc,
        startAt,
        endAt,
        createdByUserId: userId,
        attendees: {
          createMany: {
            data: attendees.map((uid) => ({
              userId: uid,
              status: AgendaAttendanceStatus.PENDING,
            })),
          },
        },
      },
      select: { id: true },
    });

    revalidatePath("/agenda");
    revalidatePath(`/agenda/${event.id}`);
    return { ok: true, id: event.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear el evento";
    return { ok: false, error: msg };
  }
}

const updateSchema = createSchema.extend({
  id: z.string().min(1),
});

export async function updateAgendaEvent(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requireAgendaAction("update");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const existing = await prisma.agendaEvent.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!existing) {
      return { ok: false, error: "Evento no encontrado" };
    }

    const startAt = parseIsoDate(parsed.data.startAt);
    const endAt = parseIsoDate(parsed.data.endAt);
    if (!startAt || !endAt || endAt <= startAt) {
      return { ok: false, error: "La fecha/hora de fin debe ser posterior al inicio." };
    }

    const attendees = [...new Set(parsed.data.attendeeUserIds)].filter((id) => id !== userId);
    const okMembers = await assertMembersOfCompany(companyId, attendees);
    if (!okMembers) {
      return { ok: false, error: "Uno o más asistentes no pertenecen a la empresa." };
    }

    const desc = parsed.data.description?.trim() || null;
    const loc = parsed.data.location?.trim() || null;

    await prisma.$transaction(async (tx) => {
      await tx.agendaEvent.update({
        where: { id: existing.id },
        data: {
          title: parsed.data.title,
          description: desc,
          location: loc,
          startAt,
          endAt,
        },
      });

      await tx.agendaAttendance.deleteMany({ where: { eventId: existing.id } });
      if (attendees.length > 0) {
        await tx.agendaAttendance.createMany({
          data: attendees.map((uid) => ({
            eventId: existing.id,
            userId: uid,
            status: AgendaAttendanceStatus.PENDING,
          })),
        });
      }
    });

    revalidatePath("/agenda");
    revalidatePath(`/agenda/${existing.id}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar";
    return { ok: false, error: msg };
  }
}

export async function deleteAgendaEvent(
  eventId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireAgendaAction("delete");

    const existing = await prisma.agendaEvent.findFirst({
      where: { id: eventId, companyId },
    });
    if (!existing) {
      return { ok: false, error: "Evento no encontrado" };
    }

    await prisma.agendaEvent.delete({ where: { id: existing.id } });

    revalidatePath("/agenda");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return { ok: false, error: msg };
  }
}

const respondSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum([AgendaAttendanceStatus.ACCEPTED, AgendaAttendanceStatus.DECLINED]),
});

/**
 * El invitado acepta o rechaza. Requiere permiso de lectura de agenda y ser asistente del evento.
 */
export async function respondAgendaInvitation(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, userId } = await requireAgendaRead();
    const parsed = respondSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const event = await prisma.agendaEvent.findFirst({
      where: { id: parsed.data.eventId, companyId },
      select: { id: true },
    });
    if (!event) {
      return { ok: false, error: "Evento no encontrado" };
    }

    const att = await prisma.agendaAttendance.findFirst({
      where: { eventId: event.id, userId },
    });
    if (!att) {
      return { ok: false, error: "No estás invitado a este evento." };
    }
    if (att.status !== AgendaAttendanceStatus.PENDING) {
      return { ok: false, error: "Ya respondiste a esta invitación." };
    }

    await prisma.agendaAttendance.update({
      where: { id: att.id },
      data: {
        status: parsed.data.status,
        respondedAt: new Date(),
      },
    });

    revalidatePath("/agenda");
    revalidatePath(`/agenda/${event.id}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al responder";
    return { ok: false, error: msg };
  }
}
