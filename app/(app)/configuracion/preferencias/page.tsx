import { CompanyRole } from "@/lib/prisma/enums-public";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CompanyGeneralSettingsPanel } from "@/components/configuracion/company-general-settings-panel";
import { ConfiguracionSubpageBack } from "@/components/configuracion/configuracion-subpage-back";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { getActiveCompanyForOwnerConfig } from "@/lib/data/config-company";
import { isR2Configured } from "@/lib/storage/r2";

export default async function ConfiguracionPreferenciasPage() {
  const session = await getServerSession(authOptions);
  const role = getActiveCompanyRole(session);
  const activeId = session?.activeCompanyId;

  if (!activeId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "configuracion", "read");

  if (role !== CompanyRole.OWNER) {
    redirect("/configuracion");
  }

  const company = await getActiveCompanyForOwnerConfig(activeId, role);

  if (!company) {
    return (
      <div className="space-y-4">
        <ConfiguracionSubpageBack />
        <p className="text-destructive text-sm" role="alert">
          No se encontró la empresa activa. Prueba a cambiar de empresa en el menú o vuelve a
          iniciar sesión.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ConfiguracionSubpageBack />
      <PageHeader
        title="Preferencias generales"
        description="Estilo del menú y del panel principal, imágenes de marca y opciones de apariencia para todos los miembros de la empresa."
      />
      <CompanyGeneralSettingsPanel
        companyId={activeId}
        storageR2Ready={isR2Configured()}
        sidebarPanelStyle={company.sidebarPanelStyle}
        sidebarCoverUrl={company.sidebarCoverUrl}
        sidebarAvatarUrl={company.sidebarAvatarUrl}
        sidebarCoverHasR2={Boolean(company.sidebarCoverStorageKey)}
        sidebarAvatarHasR2={Boolean(company.sidebarAvatarStorageKey)}
      />
    </div>
  );
}
