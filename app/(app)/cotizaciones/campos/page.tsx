import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { QuotationCustomFieldsPanel } from "@/components/cotizaciones/quotation-custom-fields-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { listQuotationCustomFieldsForCompany } from "@/lib/data/quotation-custom-fields";

export default async function CotizacionCamposPage() {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "campos_cotizacion", "read");

  const [fields, canCreate, canUpdate, canDelete] = await Promise.all([
    listQuotationCustomFieldsForCompany(session.activeCompanyId),
    sessionHasPermission(session, "campos_cotizacion", "create"),
    sessionHasPermission(session, "campos_cotizacion", "update"),
    sessionHasPermission(session, "campos_cotizacion", "delete"),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Campos personalizados"
          description="Define campos extra que aparecerán al crear cotizaciones (texto, número, fecha). Los valores se guardan en cada cotización."
        />
        <Button variant="secondary" className="w-fit shrink-0" asChild>
          <Link href="/cotizaciones">Volver a cotizaciones</Link>
        </Button>
      </div>

      <QuotationCustomFieldsPanel
        initialFields={fields}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
