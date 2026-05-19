import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import {
  requirePermission,
  sessionHasPermission,
  sessionOrdenesReadAll,
} from "@/lib/auth/check-permission";
import { WORK_ORDER_STATUS_LABEL } from "@/lib/data/work-order-status";
import {
  listWorkOrdersForCompany,
  listWorkOrdersVisibleToUser,
} from "@/lib/data/work-orders";

const dateFmt = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function statusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-muted text-muted-foreground";
    case "ASSIGNED":
      return "bg-sky-500/12 text-sky-900 dark:text-sky-100";
    case "IN_PROGRESS":
      return "bg-amber-500/12 text-amber-900 dark:text-amber-100";
    case "RESCHEDULED":
      return "bg-violet-500/12 text-violet-900 dark:text-violet-100";
    case "COMPLETED":
      return "bg-emerald-500/12 text-emerald-900 dark:text-emerald-100";
    case "CANCELLED":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function OrdenesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!session?.activeCompanyId || !userId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "ordenes", "read");

  const companyId = session.activeCompanyId;
  const canCreate = await sessionHasPermission(session, "ordenes", "create");
  const viewAll = sessionOrdenesReadAll(session);

  const rows = viewAll
    ? await listWorkOrdersForCompany(companyId)
    : await listWorkOrdersVisibleToUser(companyId, userId);

  return (
    <div className="space-y-8">
      <OrdenesHeader canCreate={canCreate} viewAll={viewAll} />
      <OrdenesTable rows={rows} canCreate={canCreate} viewAll={viewAll} />
    </div>
  );
}

function OrdenesHeader({ canCreate, viewAll }: { canCreate: boolean; viewAll: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <PageHeader
        title="Órdenes de trabajo"
        description={
          viewAll
            ? "Gestiona órdenes, asignaciones, estados e historial. Puedes vincular eventos de agenda y cotizaciones."
            : "Ves las órdenes que creaste o que te fueron asignadas."
        }
      />
      {canCreate ? (
        <Button asChild className="w-fit shrink-0">
          <Link href="/ordenes/nueva">Nueva orden</Link>
        </Button>
      ) : null}
    </div>
  );
}

function OrdenesTable({
  rows,
  canCreate,
  viewAll,
}: {
  rows: Awaited<ReturnType<typeof listWorkOrdersForCompany>>;
  canCreate: boolean;
  viewAll: boolean;
}) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">N°</th>
            <th className="px-4 py-3 font-medium">Título</th>
            <th className="hidden py-3 font-medium md:table-cell">Asignado</th>
            <th className="hidden py-3 font-medium lg:table-cell">Vínculos</th>
            <th className="py-3 font-medium">Estado</th>
            <th className="hidden py-3 font-medium sm:table-cell">Creada</th>
            <th className="w-20 px-2 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                {viewAll ? "Aún no hay órdenes de trabajo." : "No tienes órdenes asignadas ni creadas."}{" "}
                {canCreate ? (
                  <>
                    <Link href="/ordenes/nueva" className="text-primary font-medium underline">
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
                <td className="text-foreground px-4 py-3 font-mono text-xs">{r.orderNumber}</td>
                <td className="text-foreground max-w-[200px] truncate px-4 py-3 font-medium">{r.title}</td>
                <td className="text-muted-foreground hidden py-3 md:table-cell">
                  {r.assignedTo ? r.assignedTo.name : "—"}
                </td>
                <td className="text-muted-foreground hidden py-3 text-xs lg:table-cell">
                  {r.agendaEvent ? "Agenda" : null}
                  {r.agendaEvent && r.quotation ? " · " : null}
                  {r.quotation ? r.quotation.quoteNumber : null}
                  {!r.agendaEvent && !r.quotation ? "—" : null}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(r.status)}`}
                  >
                    {WORK_ORDER_STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="text-muted-foreground hidden py-3 text-xs tabular-nums sm:table-cell">
                  {dateFmt.format(r.createdAt)}
                </td>
                <td className="px-2 py-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/ordenes/${r.id}`}>Ver</Link>
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
