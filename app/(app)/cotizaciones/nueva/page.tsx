import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { NewQuotationForm } from "@/components/cotizaciones/new-quotation-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getClientsForCompany } from "@/lib/data/company-clients";
import { getActiveServicesForCompany } from "@/lib/data/company-services";
import { listQuotationCustomFieldsForCompany } from "@/lib/data/quotation-custom-fields";

export default async function NuevaCotizacionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "cotizaciones", "create");

  const [catalogServices, clients, canCreateClient, customFields] = await Promise.all([
    getActiveServicesForCompany(session.activeCompanyId),
    getClientsForCompany(session.activeCompanyId),
    sessionHasPermission(session, "clientes", "create"),
    listQuotationCustomFieldsForCompany(session.activeCompanyId),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nueva cotización"
        description="El número se asigna solo al guardar. Puedes ajustar prefijo y cifras en Configuración."
      />
      <NewQuotationForm
        catalogServices={catalogServices}
        initialClients={clients}
        canCreateClient={canCreateClient}
        customFields={customFields}
      />
    </div>
  );
}
