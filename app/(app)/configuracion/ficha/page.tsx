import { CompanyRole } from "@/lib/prisma/enums-public";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CompanyProfileEditPanel } from "@/components/configuracion/company-profile-edit-panel";
import { ConfiguracionSubpageBack } from "@/components/configuracion/configuracion-subpage-back";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { getActiveCompanyForOwnerConfig } from "@/lib/data/config-company";

export default async function ConfiguracionFichaPage() {
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
        title="Ficha de la empresa"
        description="Nombre, identificador en URL, numeración de cotizaciones y datos comerciales de la empresa activa."
      />
      <CompanyProfileEditPanel
        companyName={company.name}
        companySlug={company.slug}
        quoteCodePrefix={company.quoteCodePrefix}
        quoteCodePadding={company.quoteCodePadding}
        profile={{
          address: company.address,
          phone: company.phone,
          legalRepresentative: company.legalRepresentative,
          email: company.email,
          website: company.website,
          city: company.city,
          country: company.country,
          rut: company.rut,
          businessName: company.businessName,
        }}
      />
    </div>
  );
}
