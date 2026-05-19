import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { ClientsPanel } from "@/components/clientes/clients-panel";
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
    <ClientsPanel
      initialClients={clients}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  );
}
