import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { WorkOrderEditForm } from "@/components/ordenes/work-order-edit-form";
import { WorkOrderStatusActions } from "@/components/ordenes/work-order-status-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import {
  sessionHasPermission,
  sessionOrdenesReadAll,
} from "@/lib/auth/check-permission";
import { PAYMENT_STATUS_LABEL } from "@/lib/data/payment-status";
import { WORK_ORDER_STATUS_LABEL } from "@/lib/data/work-order-status";
import {
  getWorkOrderForCompany,
  listCompanyMembersForWorkOrderSelect,
  listQuotationsForWorkOrderLink,
  type WorkOrderLinkOption,
} from "@/lib/data/work-orders";

const dateTimeFmt = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function OrdenDetallePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!session?.activeCompanyId || !userId) {
    redirect("/ordenes");
  }

  const companyId = session.activeCompanyId;
  const order = await getWorkOrderForCompany(id, companyId);
  if (!order) {
    notFound();
  }

  const viewAll = sessionOrdenesReadAll(session);
  const isAssignee = order.assignedUserId === userId;
  const isCreator = order.createdByUserId === userId;

  if (!viewAll && !isAssignee && !isCreator) {
    redirect("/ordenes");
  }

  const canUpdate = await sessionHasPermission(session, "ordenes", "update");
  const canDelete = await sessionHasPermission(session, "ordenes", "delete");
  const canCreatePayment = await sessionHasPermission(session, "pagos", "create");

  const [members, quotations] = await Promise.all([
    listCompanyMembersForWorkOrderSelect(companyId),
    listQuotationsForWorkOrderLink(companyId),
  ]);

  const quoteOptions = buildLinkOptions(quotations, order.quotation, (q) => ({
    id: q.id,
    label: `${q.quoteNumber} · ${q.clientName}`,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={order.orderNumber} description={order.title} />
        <Button variant="outline" asChild className="w-fit shrink-0">
          <Link href="/ordenes">Volver al listado</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="border-border bg-card/60 rounded-xl border p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Estado">
                <span className="font-medium">{WORK_ORDER_STATUS_LABEL[order.status]}</span>
              </DetailItem>
              <DetailItem label="Creada">
                {dateTimeFmt.format(order.createdAt)}
              </DetailItem>
              <DetailItem label="Creada por">
                {order.createdBy.name}
              </DetailItem>
              <DetailItem label="Asignada a">
                {order.assignedTo ? order.assignedTo.name : "—"}
              </DetailItem>
              <DetailItem label="Fecha programada">
                {order.scheduledAt ? dateFmt.format(order.scheduledAt) : "—"}
              </DetailItem>
              <DetailItem label="Completada">
                {order.completedAt ? dateTimeFmt.format(order.completedAt) : "—"}
              </DetailItem>
              {order.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Descripción
                  </dt>
                  <dd className="text-foreground mt-1 whitespace-pre-wrap">{order.description}</dd>
                </div>
              ) : null}
            </dl>

            <div className="border-border mt-6 flex flex-wrap gap-3 border-t pt-4">
              {order.agendaEvent ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/agenda/${order.agendaEvent.id}`}>Ver evento de agenda</Link>
                </Button>
              ) : null}
              {order.quotation ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/cotizaciones/${order.quotation.id}`}>
                    Ver cotización {order.quotation.quoteNumber}
                  </Link>
                </Button>
              ) : null}
              {canCreatePayment ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/pagos/nueva?orden=${order.id}`}>Registrar pago</Link>
                </Button>
              ) : null}
            </div>
          </section>

          <section className="border-border bg-card/60 rounded-xl border p-6">
            <h2 className="text-foreground mb-4 text-sm font-semibold">Historial de cambios</h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin registros.</p>
            ) : (
              <ol className="border-border relative space-y-4 border-l pl-6">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="bg-primary absolute top-1.5 -left-[25px] size-2 rounded-full" />
                    <p className="text-foreground text-sm font-medium">
                      {h.fromStatus
                        ? `${WORK_ORDER_STATUS_LABEL[h.fromStatus]} → ${WORK_ORDER_STATUS_LABEL[h.toStatus]}`
                        : WORK_ORDER_STATUS_LABEL[h.toStatus]}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {dateTimeFmt.format(h.createdAt)} — {h.changedBy.name}
                    </p>
                    {h.assignedTo ? (
                      <p className="text-muted-foreground text-xs">Asignado: {h.assignedTo.name}</p>
                    ) : null}
                    {h.note ? <p className="text-muted-foreground mt-1 text-sm">{h.note}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {order.payments.length > 0 ? (
            <section className="border-border bg-card/60 rounded-xl border p-6">
              <h2 className="text-foreground mb-4 text-sm font-semibold">Pagos vinculados</h2>
              <ul className="space-y-2">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {priceFmt.format(Number(p.total))} — {p.worker.name} (
                      {PAYMENT_STATUS_LABEL[p.status]})
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pagos/${p.id}`}>Ver</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <WorkOrderStatusActions
            workOrderId={order.id}
            currentStatus={order.status}
            assignedUserId={order.assignedUserId}
            members={members}
            canAssign={canUpdate}
          />
          <WorkOrderEditForm
            workOrder={{
              id: order.id,
              title: order.title,
              description: order.description,
              assignedUserId: order.assignedUserId,
              quotationId: order.quotationId,
              scheduledAt: order.scheduledAt,
              status: order.status,
            }}
            members={members}
            quotations={quoteOptions}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </aside>
      </div>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</dt>
      <dd className="text-foreground mt-1">{children}</dd>
    </div>
  );
}

function buildLinkOptions<T extends { id: string }>(
  available: WorkOrderLinkOption[],
  current: T | null,
  labelOf: (item: T) => WorkOrderLinkOption,
): WorkOrderLinkOption[] {
  const out = [...available];
  if (current && !out.some((o) => o.id === current.id)) {
    out.unshift(labelOf(current));
  }
  return out;
}
