import { prisma } from "@/lib/db/prisma";
import { isInAppNotificationEnabled } from "@/lib/notifications/company-notification-catalog";

/**
 * Crea una notificación en panel si la empresa tiene activado el evento en `notificationInAppEvents`.
 * No lanza: errores solo se registran en consola en desarrollo.
 */
export async function createInAppNotificationIfEnabled(params: {
  companyId: string;
  userId: string;
  eventKey: string;
  title: string;
  body?: string | null;
  href?: string | null;
}): Promise<void> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.companyId },
      select: { notificationInAppEvents: true },
    });
    if (!company) return;
    if (!isInAppNotificationEnabled(company.notificationInAppEvents, params.eventKey)) {
      return;
    }
    await prisma.inAppNotification.create({
      data: {
        userId: params.userId,
        companyId: params.companyId,
        title: params.title,
        body: params.body?.trim() ? params.body.trim() : null,
        href: params.href?.trim() ? params.href.trim() : null,
        eventKey: params.eventKey,
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createInAppNotificationIfEnabled]", e);
    }
  }
}
