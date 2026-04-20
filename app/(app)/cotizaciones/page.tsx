import Link from "next/link";
import { Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { isPendingClientConfirmationAfterEmail } from "@/lib/data/quotation-follow-up";
import { listQuotationsForCompany } from "@/lib/data/quotations";
import {
  QUOTATION_STATUS_LABEL,
  type QuotationStatus,
} from "@/lib/data/quotation-status";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function CotizacionesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "cotizaciones", "read");

  const canCreate = await sessionHasPermission(session, "cotizaciones", "create");
  const rows = await listQuotationsForCompany(session.activeCompanyId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Cotizaciones"
          description="Número automático por empresa, líneas editables solo en el documento y vista previa en PDF."
        />
        {canCreate ? (
          <Button asChild className="w-fit shrink-0">
            <Link href="/cotizaciones/nueva">Nueva cotización</Link>
          </Button>
        ) : null}
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">N°</th>
              <th className="hidden py-3 font-medium md:table-cell">Fecha servicio</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="hidden py-3 font-medium lg:table-cell">Estado</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="w-24 px-2 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-10 text-center">
                  Aún no hay cotizaciones.
                  {canCreate ? (
                    <>
                      {" "}
                      <Link href="/cotizaciones/nueva" className="text-primary font-medium underline">
                        Crear la primera
                      </Link>
                      .
                    </>
                  ) : null}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-border border-t">
                  <td className="text-foreground px-4 py-3 font-mono text-xs">{r.quoteNumber}</td>
                  <td className="text-muted-foreground hidden py-3 md:table-cell">
                    {new Intl.DateTimeFormat("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(r.serviceDate)}
                  </td>
                  <td className="text-foreground px-4 py-3">
                    <div className="font-medium">{r.clientName}</div>
                  </td>
                  <td className="hidden py-3 lg:table-cell">
                    <div className="flex max-w-[200px] flex-col gap-1">
                      <span className="bg-muted text-muted-foreground inline-flex w-fit rounded-full px-2 py-0.5 text-xs">
                        {QUOTATION_STATUS_LABEL[r.status]}
                      </span>
                      {r.emailSent ? (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Mail className="size-3 shrink-0 opacity-70" aria-hidden />
                          Correo enviado
                        </span>
                      ) : null}
                      {isPendingClientConfirmationAfterEmail({
                        emailSent: r.emailSent,
                        status: r.status as QuotationStatus,
                      }) ? (
                        <span className="text-amber-700 dark:text-amber-400 text-xs font-medium">
                          Pendiente confirmación
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-foreground px-4 py-3 tabular-nums">{priceFmt.format(Number(r.total))}</td>
                  <td className="px-2 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/cotizaciones/${r.id}`}>Ver</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
