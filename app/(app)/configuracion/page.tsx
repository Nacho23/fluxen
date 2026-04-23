import { CompanyRole } from "@/lib/prisma/enums-public";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CompanyNewCompanySection } from "@/components/configuracion/company-new-company-section";
import { ConfiguracionHubTiles } from "@/components/configuracion/configuracion-hub-tiles";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  const role = getActiveCompanyRole(session);
  const activeId = session?.activeCompanyId;

  if (!activeId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "configuracion", "read");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        description="Crea empresas adicionales o abre la ficha, las preferencias generales o las notificaciones de la empresa activa. Los permisos finos los define el propietario en la matriz."
      />

      {role === CompanyRole.OWNER ? (
        <div className="flex flex-col gap-8">
          <CompanyNewCompanySection />
          <ConfiguracionHubTiles />
        </div>
      ) : (
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
          Solo el propietario de la empresa seleccionada puede crear otras empresas o editar la
          ficha y las preferencias desde esta sección.
        </p>
      )}
    </div>
  );
}
