import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { NewQuotationForm } from "@/components/cotizaciones/new-quotation-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getClientsForCompany } from "@/lib/data/company-clients";
import { getActiveServicesForCompany } from "@/lib/data/company-services";
import { listQuotationCustomFieldsForCompany } from "@/lib/data/quotation-custom-fields";
import { listQuotationTemplatesForQuotationForm } from "@/lib/data/quotation-templates";

export default async function NuevaCotizacionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "cotizaciones", "create");

  const companyId = session.activeCompanyId;
  const [catalogServices, clients, canCreateClient, customFields, templates] = await Promise.all([
    getActiveServicesForCompany(companyId),
    getClientsForCompany(companyId),
    sessionHasPermission(session, "clientes", "create"),
    listQuotationCustomFieldsForCompany(companyId),
    listQuotationTemplatesForQuotationForm(companyId),
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
        templates={templates}
      />
    </div>
  );
}
