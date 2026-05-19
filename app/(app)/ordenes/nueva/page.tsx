import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { NewWorkOrderForm } from "@/components/ordenes/new-work-order-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import {
  listCompanyMembersForWorkOrderSelect,
  listQuotationsForWorkOrderLink,
} from "@/lib/data/work-orders";

export default async function NuevaOrdenPage() {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/ordenes");
  }
  await requirePermission(session, "ordenes", "create");

  const companyId = session.activeCompanyId;
  const [members, quotations] = await Promise.all([
    listCompanyMembersForWorkOrderSelect(companyId),
    listQuotationsForWorkOrderLink(companyId),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nueva orden de trabajo"
        description="El vínculo a cotización es opcional. Puedes asignar un trabajador ahora o más tarde. Se creará automáticamente un evento en la agenda."
      />
      <NewWorkOrderForm members={members} quotations={quotations} />
    </div>
  );
}
