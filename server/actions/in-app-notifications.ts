"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

export type InAppNotificationRow = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function getInAppNotificationsForPanel(): Promise<{
  ok: true;
  unreadCount: number;
  items: InAppNotificationRow[];
} | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    return { ok: false, error: "No autorizado" };
  }

  const userId = session.user.id;
  const companyId = session.activeCompanyId;

  const [unreadCount, items] = await Promise.all([
    prisma.inAppNotification.count({
      where: { userId, companyId, readAt: null },
    }),
    prisma.inAppNotification.findMany({
      where: { userId, companyId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ok: true,
    unreadCount,
    items: items.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      href: r.href,
      readAt: r.readAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function markInAppNotificationRead(
  notificationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    return { ok: false, error: "No autorizado" };
  }

  const row = await prisma.inAppNotification.findFirst({
    where: {
      id: notificationId,
      userId: session.user.id,
      companyId: session.activeCompanyId,
    },
    select: { id: true, readAt: true },
  });
  if (!row) {
    return { ok: false, error: "No encontrada" };
  }
  if (row.readAt) {
    return { ok: true };
  }

  await prisma.inAppNotification.update({
    where: { id: row.id },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllInAppNotificationsRead(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    return { ok: false, error: "No autorizado" };
  }

  await prisma.inAppNotification.updateMany({
    where: {
      userId: session.user.id,
      companyId: session.activeCompanyId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
