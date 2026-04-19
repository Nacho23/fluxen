import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { NewPaymentForm } from "@/components/pagos/new-payment-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { listCompanyMembersForPaymentSelect } from "@/lib/data/payments";

export default async function NuevaPagoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/pagos");
  }
  await requirePermission(session, "pagos", "create");

  const members = await listCompanyMembersForPaymentSelect(session.activeCompanyId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Registrar pago"
        description="El trabajador debe ser usuario de la empresa. Podrá revisar el registro y confirmar recepción."
      />
      <NewPaymentForm members={members} />
    </div>
  );
}
