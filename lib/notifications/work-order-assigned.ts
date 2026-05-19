import {
  IN_APP_KEY_WORK_ORDER_ASSIGNED,
  NOTIFICATION_KEY_WORK_ORDER_ASSIGNED_EMAIL,
  isEmailNotificationEnabled,
} from "@/lib/notifications/company-notification-catalog";
import { createInAppNotificationIfEnabled } from "@/lib/notifications/in-app-delivery";
import {
  buildWorkOrderAssignedEmailContent,
  buildWorkOrderDetailUrl,
} from "@/lib/email/work-order-assigned-email";
import { sendTransactionalEmail } from "@/lib/email/resend-send";
import { prisma } from "@/lib/db/prisma";

/**
 * Notifica al trabajador (panel y/o correo) cuando se le asigna una orden.
 * No lanza si falla el correo; el in-app ya tolera errores internamente.
 */
export async function notifyWorkOrderAssigned(params: {
  companyId: string;
  workOrderId: string;
  orderNumber: string;
  title: string;
  assigneeUserId: string;
}): Promise<void> {
  const [company, assignee] = await Promise.all([
    prisma.company.findUnique({
      where: { id: params.companyId },
      select: { name: true, notificationEmailEvents: true },
    }),
    prisma.user.findUnique({
      where: { id: params.assigneeUserId },
      select: { name: true, email: true },
    }),
  ]);
  if (!assignee) return;

  const href = `/ordenes/${params.workOrderId}`;
  await createInAppNotificationIfEnabled({
    companyId: params.companyId,
    userId: params.assigneeUserId,
    eventKey: IN_APP_KEY_WORK_ORDER_ASSIGNED,
    title: "Orden de trabajo asignada",
    body: `${params.orderNumber}: ${params.title}`,
    href,
  });

  if (!company?.name || !assignee.email?.trim()) return;
  if (!isEmailNotificationEnabled(company.notificationEmailEvents, NOTIFICATION_KEY_WORK_ORDER_ASSIGNED_EMAIL)) {
    return;
  }

  const detailUrl = buildWorkOrderDetailUrl(params.workOrderId);
  const { subject, html } = buildWorkOrderAssignedEmailContent({
    workerName: assignee.name,
    companyName: company.name,
    orderNumber: params.orderNumber,
    title: params.title,
    detailUrl,
  });

  const sent = await sendTransactionalEmail({
    to: assignee.email.trim(),
    subject,
    html,
  });
  if (!sent.ok && process.env.NODE_ENV === "development") {
    console.error("[notifyWorkOrderAssigned] email", sent.error);
  }
}
