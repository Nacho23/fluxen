import { CompanyRole } from "@/lib/prisma/enums-public";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CompanyManagementPanel } from "@/components/configuracion/company-management-panel";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  const role = getActiveCompanyRole(session);
  const activeId = session?.activeCompanyId;

  if (!activeId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "configuracion", "read");

  const activeCompany =
    role === CompanyRole.OWNER && activeId
      ? await prisma.company.findUnique({
          where: { id: activeId },
          select: {
            name: true,
            slug: true,
            quoteCodePrefix: true,
            quoteCodePadding: true,
          },
        })
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        description="Ajustes del espacio de trabajo. Crear empresas adicionales o editar la empresa activa solo lo puede hacer el propietario."
      />

      {role === CompanyRole.OWNER && activeCompany ? (
        <CompanyManagementPanel
          companyName={activeCompany.name}
          companySlug={activeCompany.slug}
          quoteCodePrefix={activeCompany.quoteCodePrefix}
          quoteCodePadding={activeCompany.quoteCodePadding}
        />
      ) : role === CompanyRole.OWNER && activeId && !activeCompany ? (
        <p className="text-destructive text-sm" role="alert">
          No se encontró la empresa activa. Prueba a cambiar de empresa en el menú o vuelve a
          iniciar sesión.
        </p>
      ) : role !== CompanyRole.OWNER ? (
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
          Solo el propietario de la empresa seleccionada puede crear otras empresas o editar el
          nombre y el identificador desde esta pantalla.
        </p>
      ) : null}
    </div>
  );
}
