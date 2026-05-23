import { CompanyRole } from "@/lib/prisma/enums-public";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { QuotationTemplateManager } from "@/components/cotizaciones/quotation-template-manager";
import { ConfiguracionSubpageBack } from "@/components/configuracion/configuracion-subpage-back";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { getCompanyForTemplateBuilder } from "@/lib/data/company-quotation-pdf";
import { listQuotationCustomFieldsForCompany } from "@/lib/data/quotation-custom-fields";
import {
  getOrCreateDefaultQuotationTemplate,
  listQuotationTemplatesForCompany,
} from "@/lib/data/quotation-templates";

type Props = Readonly<{ searchParams: Promise<{ t?: string }> }>;

export default async function ConfiguracionCotizacionesFormatoPage({ searchParams }: Props) {
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

  const { t: selectedTemplateId } = await searchParams;

  const [company, allTemplates, defaultTemplate, canSave, customFieldDefs] = await Promise.all([
    getCompanyForTemplateBuilder(activeId),
    listQuotationTemplatesForCompany(activeId),
    getOrCreateDefaultQuotationTemplate(activeId),
    sessionHasPermission(session, "configuracion", "update"),
    listQuotationCustomFieldsForCompany(activeId),
  ]);

  if (!company) {
    return (
      <div className="space-y-4">
        <ConfiguracionSubpageBack />
        <p className="text-destructive text-sm" role="alert">
          No se encontró la empresa activa.
        </p>
      </div>
    );
  }

  // Si hay un ?t=id en la URL, intentar cargar ese template; de lo contrario usar el default
  const activeTemplate =
    selectedTemplateId && allTemplates.find((t) => t.id === selectedTemplateId)
      ? allTemplates.find((t) => t.id === selectedTemplateId)!
      : defaultTemplate;

  return (
    <div className="space-y-8">
      <ConfiguracionSubpageBack />
      <PageHeader
        title="Formatos de cotización"
        description="Crea y administra distintos formatos PDF. Selecciona uno como predeterminado y elige el formato al crear cada cotización."
      />
      <QuotationTemplateManager
        templates={allTemplates}
        activeTemplateId={activeTemplate.id}
        canSave={canSave}
        customFieldDefs={customFieldDefs.map((f) => ({ id: f.id, label: f.label }))}
        company={{
          id: company.id,
          name: company.name,
          businessName: company.businessName,
          rut: company.rut,
          address: company.address,
          phone: company.phone,
          email: company.email,
          website: company.website,
          city: company.city,
          country: company.country,
          logoHasR2: Boolean(company.logoStorageKey),
          logoUrl: company.logoUrl,
        }}
      />
    </div>
  );
}
