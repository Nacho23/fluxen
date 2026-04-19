import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { ClientsPanel } from "@/components/clientes/clients-panel";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getClientsForCompany } from "@/lib/data/company-clients";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "clientes", "read");

  const [clients, canCreate, canUpdate, canDelete] = await Promise.all([
    getClientsForCompany(session.activeCompanyId),
    sessionHasPermission(session, "clientes", "create"),
    sessionHasPermission(session, "clientes", "update"),
    sessionHasPermission(session, "clientes", "delete"),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Personas u organizaciones con las que cotizas. Los datos se reutilizan al generar cotizaciones."
      />
      <ClientsPanel
        initialClients={clients}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
