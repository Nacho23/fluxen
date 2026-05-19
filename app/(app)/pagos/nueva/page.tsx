import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { NewPaymentForm } from "@/components/pagos/new-payment-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { listCompanyMembersForPaymentSelect } from "@/lib/data/payments";
import { listWorkOrdersForPaymentSelect } from "@/lib/data/work-orders";

type Props = Readonly<{ searchParams: Promise<{ orden?: string }> }>;

export default async function NuevaPagoPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/pagos");
  }
  await requirePermission(session, "pagos", "create");

  const companyId = session.activeCompanyId;
  const { orden } = await searchParams;

  const [members, workOrders] = await Promise.all([
    listCompanyMembersForPaymentSelect(companyId),
    listWorkOrdersForPaymentSelect(companyId),
  ]);

  const initialWorkOrderId =
    orden && workOrders.some((w) => w.id === orden) ? orden : "";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Registrar pago"
        description="El trabajador debe ser usuario de la empresa. Podrá revisar el registro y confirmar recepción."
      />
      <NewPaymentForm
        members={members}
        workOrders={workOrders}
        initialWorkOrderId={initialWorkOrderId}
      />
    </div>
  );
}
