import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CompanyNotificationsPanel } from "@/components/configuracion/company-notifications-panel";
import { ConfiguracionSubpageBack } from "@/components/configuracion/configuracion-subpage-back";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import {
  mergeEmailNotificationDefaults,
  mergeInAppNotificationDefaults,
} from "@/lib/notifications/company-notification-catalog";
import { prisma } from "@/lib/db/prisma";

export default async function ConfiguracionNotificacionesPage() {
  const session = await getServerSession(authOptions);
  const activeId = session?.activeCompanyId;

  if (!activeId) {
    redirect("/dashboard");
  }

  await requirePermission(session, "notificaciones", "read");

  const company = await prisma.company.findUnique({
    where: { id: activeId },
    select: {
      notificationEmailEvents: true,
      notificationInAppEvents: true,
    },
  });

  if (!company) {
    return (
      <div className="space-y-4">
        <ConfiguracionSubpageBack />
        <p className="text-destructive text-sm" role="alert">
          No se encontró la empresa activa.
        </p>
      </div>
    );
  }

  const canSave = await sessionHasPermission(session, "notificaciones", "update");

  return (
    <div className="space-y-8">
      <ConfiguracionSubpageBack />
      <PageHeader
        title="Notificaciones"
        description="Activa o desactiva el envío de correos transaccionales y los avisos en el panel para los miembros de la empresa."
      />
      <CompanyNotificationsPanel
        emailDefaults={mergeEmailNotificationDefaults(company.notificationEmailEvents)}
        inAppDefaults={mergeInAppNotificationDefaults(company.notificationInAppEvents)}
        canSave={canSave}
      />
    </div>
  );
}
