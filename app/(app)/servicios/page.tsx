import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageHeader } from "@/components/layout/page-header";
import { ServicesPanel } from "@/components/servicios/services-panel";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getServicesForCompany } from "@/lib/data/company-services";

export default async function ServiciosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "servicios", "read");

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    sessionHasPermission(session, "servicios", "create"),
    sessionHasPermission(session, "servicios", "update"),
    sessionHasPermission(session, "servicios", "delete"),
  ]);

  const services = await getServicesForCompany(session.activeCompanyId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Servicios"
        description="Catálogo por empresa: nombres, precios de referencia y unidad. Estos ítems podrán elegirse al armar cotizaciones."
      />
      <ServicesPanel
        initialServices={services}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
