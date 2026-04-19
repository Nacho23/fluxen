import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";

export default async function OrdenesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "ordenes", "read");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Órdenes de trabajo"
        description="Desde la solicitud hasta el cierre técnico (pendiente de implementación)."
      />
    </div>
  );
}
