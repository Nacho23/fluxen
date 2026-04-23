"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import {
  NOTIFICATION_EMAIL_CATALOG,
  NOTIFICATION_IN_APP_CATALOG,
} from "@/lib/notifications/company-notification-catalog";
import { prisma } from "@/lib/db/prisma";

export async function updateCompanyNotificationSettings(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    return { ok: false, error: "No autorizado" };
  }

  const canUpdate = await sessionHasPermission(session, "notificaciones", "update");
  if (!canUpdate) {
    return { ok: false, error: "No tienes permiso para editar las notificaciones" };
  }

  const email: Record<string, boolean> = {};
  for (const row of NOTIFICATION_EMAIL_CATALOG) {
    email[row.key] = formData.get(`email_${row.key}`) === "on";
  }

  const inApp: Record<string, boolean> = {};
  for (const row of NOTIFICATION_IN_APP_CATALOG) {
    inApp[row.key] = formData.get(`inapp_${row.key}`) === "on";
  }

  await prisma.company.update({
    where: { id: session.activeCompanyId },
    data: {
      notificationEmailEvents: email as unknown as Prisma.InputJsonValue,
      notificationInAppEvents: inApp as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/configuracion");
  revalidatePath("/configuracion/notificaciones");
  revalidatePath("/", "layout");
  return { ok: true };
}
