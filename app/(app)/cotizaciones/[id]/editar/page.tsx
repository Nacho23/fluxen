import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { NewQuotationForm } from "@/components/cotizaciones/new-quotation-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getClientsForCompany } from "@/lib/data/company-clients";
import { getActiveServicesForCompany } from "@/lib/data/company-services";
import { listQuotationCustomFieldsForCompany } from "@/lib/data/quotation-custom-fields";
import { getQuotationForCompany } from "@/lib/data/quotations";
import { parseStoredCustomFieldValues } from "@/lib/quotations/custom-field-values";
import type { QuoteDiscountMode } from "@/lib/prisma/enums-public";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

function formatDateInput(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function EditarCotizacionPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/cotizaciones");
  }
  await requirePermission(session, "cotizaciones", "update");

  const companyId = session.activeCompanyId;
  const q = await getQuotationForCompany(id, companyId);
  if (!q) notFound();

  if (q.status !== "DRAFT") {
    redirect(`/cotizaciones/${id}`);
  }

  const [catalogServices, clients, canCreateClient, customFields] = await Promise.all([
    getActiveServicesForCompany(companyId),
    getClientsForCompany(companyId),
    sessionHasPermission(session, "clientes", "create"),
    listQuotationCustomFieldsForCompany(companyId),
  ]);

  const storedCustom = parseStoredCustomFieldValues(q.customFieldValues);
  const customValues: Record<string, string> = Object.fromEntries(
    customFields.map((f) => {
      const v = storedCustom[f.id];
      return [f.id, typeof v === "string" ? v : ""];
    }),
  );

  const discountValueStr =
    q.discountValue != null ? String(q.discountValue).replace(".", ",") : "";

  const initialLines = q.lines.map((l) => ({
    key: l.id,
    serviceId: l.serviceId ?? null,
    name: l.name,
    description: l.description ?? "",
    itemType: (l.itemType ?? "") as "" | "SERVICIO" | "PRODUCTO",
    unitPrice: String(l.unitPrice).replace(".", ","),
    quantity: String(l.quantity).replace(".", ","),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Editar ${q.quoteNumber}`}
        description="Solo puedes editar cotizaciones en estado Borrador. El número de cotización no cambia."
      />
      <NewQuotationForm
        catalogServices={catalogServices}
        initialClients={clients}
        canCreateClient={canCreateClient}
        customFields={customFields}
        initialData={{
          quotationId: q.id,
          serviceDate: formatDateInput(q.serviceDate),
          clientId: q.clientId ?? "",
          discountMode: q.discountMode as QuoteDiscountMode,
          discountValue: discountValueStr,
          lines: initialLines,
          customValues,
        }}
      />
    </div>
  );
}
