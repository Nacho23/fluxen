import Link from "next/link";
import { getServerSession } from "next-auth";

import { CreateCompanyCard } from "@/components/dashboard/create-company-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { canManageOrganizations, getActiveCompanyRole } from "@/lib/auth/permissions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const companies = session?.companies ?? [];
  const hasCompanies = companies.length > 0;
  const activeName = companies.find((c) => c.id === session?.activeCompanyId)?.name;
  const role = getActiveCompanyRole(session);
  const showOrgSettings = hasCompanies && canManageOrganizations(role);

  if (hasCompanies && session?.activeCompanyId) {
    await requirePermission(session, "dashboard", "read");
  }

  return (
    <div className="space-y-8">
      {hasCompanies ? (
        <PageHeader
          title="Panel"
          description="Resumen operativo y alertas (pendiente de implementación)."
        />
      ) : (
        <PageHeader
          title="Empecemos"
          description="Aún no tienes empresas. Crea la primera para aislar clientes, cotizaciones y órdenes por negocio."
        />
      )}

      {!hasCompanies ? (
        <CreateCompanyCard />
      ) : (
        <div className="flex max-w-lg flex-col gap-4">
          <div className="border-border bg-card/60 text-card-foreground inline-flex flex-col gap-1 rounded-xl border px-4 py-3 text-sm shadow-sm">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Empresa activa
            </span>
            <span className="text-foreground text-base font-semibold">{activeName}</span>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Los datos que agregues quedarán asociados a esta empresa. Puedes cambiar de empresa
              desde el menú lateral.
            </p>
          </div>
          {showOrgSettings ? (
            <Button variant="outline" className="w-fit gap-2" asChild>
              <Link href="/configuracion#empresas">Crear o editar empresas</Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
