import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AgendaEventForm } from "@/components/agenda/event-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { getCompanyMembersForCompany } from "@/lib/data/company-members";

export default async function NuevaAgendaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "agenda", "create");

  const members = await getCompanyMembersForCompany(session.activeCompanyId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nuevo evento"
        description="Define fecha, lugar y quiénes deben confirmar asistencia."
      />
      <AgendaEventForm members={members} mode="create" />
    </div>
  );
}
