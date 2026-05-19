import Link from "next/link";
import { Mail } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { QuotationStatusActions } from "@/components/cotizaciones/quotation-status-actions";
import { SendQuotationEmailButton } from "@/components/cotizaciones/send-quotation-email-button";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { formatDateLongUtc, formatDateTimeShortLocal } from "@/lib/dates/format-utc";
import { findAgendaEventIdForQuotation } from "@/lib/data/agenda";
import { isPendingClientConfirmationAfterEmail } from "@/lib/data/quotation-follow-up";
import { listQuotationCustomFieldsForCompany } from "@/lib/data/quotation-custom-fields";
import {
  effectiveQuotationClientEmail,
  getQuotationForCompany,
  type QuotationDetailLine,
} from "@/lib/data/quotations";
import {
  formatCustomFieldValueForDisplay,
  parseStoredCustomFieldValues,
} from "@/lib/quotations/custom-field-values";
import {
  QUOTATION_STATUS_LABEL,
  type QuotationStatus,
} from "@/lib/data/quotation-status";
import {
  SERVICE_ITEM_TYPE_LABEL,
  type ServiceItemType,
} from "@/lib/data/service-item-type";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function typeLabel(t: ServiceItemType | null): string {
  if (t == null) return "—";
  return SERVICE_ITEM_TYPE_LABEL[t];
}

export default async function CotizacionDetallePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await getServerSession(authOptions);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "cotizaciones", "read");

  const canUpdate = await sessionHasPermission(session, "cotizaciones", "update");
  const canUpdateStatus = canUpdate;
  const canReadAgenda = await sessionHasPermission(session, "agenda", "read");

  const { id } = await params;
  const q = await getQuotationForCompany(id, session.activeCompanyId);
  if (!q) {
    notFound();
  }

  const customDefinitions = await listQuotationCustomFieldsForCompany(session.activeCompanyId);
  const storedCustom = parseStoredCustomFieldValues(q.customFieldValues);
  const clientEmailForActions = effectiveQuotationClientEmail(q);
  const emailShownFromClientOnly = !q.clientEmail?.trim() && Boolean(clientEmailForActions);

  const agendaEventId =
    q.status === "ACCEPTED" && canReadAgenda
      ? await findAgendaEventIdForQuotation(q.id, session.activeCompanyId)
      : null;

  const pdfUrl = `/api/quotations/${q.id}/pdf`;
  const statusLabel = QUOTATION_STATUS_LABEL[q.status as QuotationStatus];
  const pendingAfterEmail = isPendingClientConfirmationAfterEmail({
    emailSent: q.emailSent,
    status: q.status as QuotationStatus,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={q.quoteNumber}
          description={`${q.company.name} · ${statusLabel}${
            q.emailSent ? " · Correo al cliente enviado" : ""
          }${pendingAfterEmail ? " · Pendiente confirmación del cliente" : ""}`}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link href="/cotizaciones">Volver al listado</Link>
          </Button>
          {canUpdate && q.status === "DRAFT" ? (
            <Button variant="outline" asChild>
              <Link href={`/cotizaciones/${q.id}/editar`}>Editar borrador</Link>
            </Button>
          ) : null}
          <Button asChild>
            <a href={pdfUrl} download={`cotizacion-${q.quoteNumber}.pdf`}>
              Descargar PDF
            </a>
          </Button>
        </div>
      </div>

      {pendingAfterEmail ? (
        <div
          className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          <Mail className="text-amber-700 dark:text-amber-300 mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Pendiente de confirmación del cliente</p>
            <p className="text-amber-900/90 dark:text-amber-100/90 mt-1 text-xs leading-relaxed">
              La cotización ya se envió por correo. Cuando el cliente confirme o rechace por el canal que uses,
              actualiza el estado en el resumen de esta página.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="border-border bg-card/60 space-y-4 rounded-xl border p-5 shadow-sm">
          <h2 className="text-foreground text-sm font-semibold">Resumen</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fecha del servicio</dt>
              <dd>{formatDateLongUtc(q.serviceDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="text-right font-medium">{q.clientName}</dd>
            </div>
            {clientEmailForActions ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">Correo</dt>
                <dd className="text-right break-all">
                  <span className="text-foreground">{clientEmailForActions}</span>
                  {emailShownFromClientOnly ? (
                    <span className="text-muted-foreground mt-1 block text-xs">
                      Tomado de la ficha actual del cliente (el documento se emitió sin correo en la
                      cotización).
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Correo</dt>
                <dd className="text-muted-foreground text-right text-sm">No indicado</dd>
              </div>
            )}
            {q.clientPhone ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Teléfono</dt>
                <dd className="text-right">{q.clientPhone}</dd>
              </div>
            ) : null}
            {customDefinitions.length > 0 ? (
              <div className="border-border space-y-2 border-t pt-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Campos adicionales
                </p>
                {customDefinitions.map((d) => (
                  <div key={d.id} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground shrink-0">{d.label}</span>
                    <span className="text-right">
                      {formatCustomFieldValueForDisplay(d.fieldType, storedCustom[d.id])}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t pt-2">
              <dt className="text-muted-foreground">Correo al cliente</dt>
              <dd className="text-right text-sm">
                {q.emailSent ? (
                  <span className="block">
                    <span className="text-foreground font-medium">Enviado</span>
                    {q.emailSentAt ? (
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {formatDateTimeShortLocal(new Date(q.emailSentAt))}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No enviado</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t pt-2">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{priceFmt.format(Number(q.subtotal))}</dd>
            </div>
            {q.discountMode !== "NONE" ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Descuento</dt>
                <dd className="tabular-nums">−{priceFmt.format(Number(q.discountAmount))}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-primary tabular-nums">{priceFmt.format(Number(q.total))}</dd>
            </div>
          </dl>

          {agendaEventId ? (
            <div className="border-border border-t pt-4">
              <h3 className="text-foreground mb-2 text-sm font-semibold">Agenda</h3>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/agenda/${agendaEventId}`}>Ver en la agenda</Link>
              </Button>
            </div>
          ) : null}

          <div className="border-border border-t pt-4">
            <h3 className="text-foreground mb-2 text-sm font-semibold">Respuesta del cliente</h3>
            <QuotationStatusActions
              quotationId={q.id}
              status={q.status}
              canUpdate={canUpdateStatus}
            />
          </div>

          <div className="border-border border-t pt-4">
            <h3 className="text-foreground mb-2 text-sm font-semibold">Envío por correo</h3>
            <SendQuotationEmailButton
              quotationId={q.id}
              clientEmail={clientEmailForActions}
              emailSent={q.emailSent}
              emailSentAt={q.emailSentAt}
            />
          </div>
        </div>

        <div className="flex min-h-[70vh] flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Vista previa PDF
          </p>
          <div className="border-border bg-muted/30 relative min-h-[60vh] flex-1 overflow-hidden rounded-xl border">
            <iframe title="Vista previa PDF" src={pdfUrl} className="size-full min-h-[60vh] border-0" />
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Líneas</h2>
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="hidden py-3 font-medium sm:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium">Cant.</th>
                <th className="px-4 py-3 font-medium">P. unit.</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {q.lines.map((line: QuotationDetailLine) => (
                <tr key={line.id} className="border-border border-t">
                  <td className="text-foreground px-4 py-3">
                    <div className="font-medium">{line.name}</div>
                    {line.description ? (
                      <div className="text-muted-foreground mt-0.5 max-w-md text-xs">{line.description}</div>
                    ) : null}
                  </td>
                  <td className="text-muted-foreground hidden py-3 sm:table-cell">{typeLabel(line.itemType)}</td>
                  <td className="text-foreground px-4 py-3 tabular-nums">{line.quantity.toString()}</td>
                  <td className="text-foreground px-4 py-3 tabular-nums">
                    {priceFmt.format(Number(line.unitPrice))}
                  </td>
                  <td className="text-foreground px-4 py-3 tabular-nums">
                    {priceFmt.format(Number(line.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
