import Link from "next/link";
import { getServerSession } from "next-auth";

import { CreateCompanyCard } from "@/components/dashboard/create-company-card";
import { PanelBrandHero } from "@/components/dashboard/panel-brand-hero";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { brandingImageSrc } from "@/lib/branding/branding-image-src";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { canManageOrganizations, getActiveCompanyRole } from "@/lib/auth/permissions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const companies = session?.companies ?? [];
  const hasCompanies = companies.length > 0;
  const activeCompany = companies.find((c) => c.id === session?.activeCompanyId);
  const activeName = activeCompany?.name;
  const role = getActiveCompanyRole(session);
  const showOrgSettings = hasCompanies && canManageOrganizations(role);
  const dashboardBranded =
    hasCompanies && (activeCompany?.sidebarPanelStyle ?? "STANDARD") === "BRANDED";
  const coverSrc =
    activeCompany?.id != null
      ? brandingImageSrc(
          activeCompany.id,
          "cover",
          activeCompany.sidebarCoverHasR2 === true,
          activeCompany.sidebarCoverUrl,
        )
      : null;
  const avatarSrc =
    activeCompany?.id != null
      ? brandingImageSrc(
          activeCompany.id,
          "avatar",
          activeCompany.sidebarAvatarHasR2 === true,
          activeCompany.sidebarAvatarUrl,
        )
      : null;

  if (hasCompanies && session?.activeCompanyId) {
    await requirePermission(session, "dashboard", "read");
  }

  return (
    <div className="space-y-8">
      {!hasCompanies ? (
        <PageHeader
          title="Empecemos"
          description="Aún no tienes empresas. Crea la primera para aislar clientes, cotizaciones y órdenes por negocio."
        />
      ) : hasCompanies && dashboardBranded && activeCompany ? (
        <>
          <PanelBrandHero
            companyName={activeCompany.name}
            coverSrc={coverSrc}
            avatarSrc={avatarSrc}
            showPersonalizeLink={showOrgSettings}
          />
          <div className="flex max-w-2xl flex-col gap-4">
            <div className="border-border bg-card/50 text-card-foreground rounded-xl border px-4 py-3 text-sm shadow-sm">
              <p className="text-muted-foreground leading-relaxed">
                Los datos que agregues quedan asociados a esta empresa. Cambia de empresa desde el
                menú lateral cuando trabajes con otro negocio.
              </p>
            </div>
            {showOrgSettings ? (
              <Button variant="outline" className="w-fit gap-2" asChild>
                <Link href="/configuracion">Crear o editar empresas</Link>
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <PageHeader
            title="Panel"
            description="Resumen operativo y alertas (pendiente de implementación)."
          />
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
                <Link href="/configuracion">Crear o editar empresas</Link>
              </Button>
            ) : null}
          </div>
        </>
      )}

      {!hasCompanies ? <CreateCompanyCard /> : null}
    </div>
  );
}
