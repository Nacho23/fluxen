import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CompanyRole } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { PAYMENT_METHOD_LABEL } from "@/lib/data/payment-method";
import { PAYMENT_STATUS_LABEL } from "@/lib/data/payment-status";
import {
  listPaymentsForCompany,
  listPaymentsForWorker,
} from "@/lib/data/payments";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function PagosPage() {
  const session = await getServerSession(authOptions);
  const role = getActiveCompanyRole(session);
  const userId = session?.user?.id;

  if (!session?.activeCompanyId || !userId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "pagos", "read");

  const companyId = session.activeCompanyId;
  const isRegistrar = await sessionHasPermission(session, "pagos", "create");
  const isWorkerView = role === CompanyRole.FIELD;

  const rows = isWorkerView
    ? await listPaymentsForWorker(companyId, userId)
    : await listPaymentsForCompany(companyId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Pagos"
          description={
            isWorkerView
              ? "Pagos registrados a tu nombre. Confirma con firma cuando corresponda."
              : "Registra pagos a trabajadores de la empresa; ellos podrán verlos y confirmar recepción."
          }
        />
        {isRegistrar ? (
          <Button asChild className="w-fit shrink-0">
            <Link href="/pagos/nueva">Registrar pago</Link>
          </Button>
        ) : null}
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha registro</th>
              {!isWorkerView ? (
                <th className="hidden py-3 font-medium lg:table-cell">Trabajador</th>
              ) : null}
              <th className="hidden py-3 font-medium md:table-cell">Forma de pago</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="hidden py-3 font-medium sm:table-cell">Estado</th>
              <th className="w-24 px-2 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={isWorkerView ? 5 : 6}
                  className="text-muted-foreground px-4 py-10 text-center"
                >
                  {isWorkerView
                    ? "Aún no hay pagos registrados a tu nombre."
                    : "Aún no hay pagos registrados."}{" "}
                  {isRegistrar ? (
                    <>
                      <Link href="/pagos/nueva" className="text-primary font-medium underline">
                        Registrar el primero
                      </Link>
                      .
                    </>
                  ) : null}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-border border-t">
                  <td className="text-muted-foreground px-4 py-3 text-xs tabular-nums">
                    {new Intl.DateTimeFormat("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(r.createdAt)}
                  </td>
                  {!isWorkerView ? (
                    <td className="text-foreground hidden py-3 lg:table-cell">
                      <div className="font-medium">{r.worker.name}</div>
                      <div className="text-muted-foreground text-xs">{r.worker.email}</div>
                    </td>
                  ) : null}
                  <td className="text-muted-foreground hidden py-3 md:table-cell">
                    {PAYMENT_METHOD_LABEL[r.paymentMethod]}
                  </td>
                  <td className="text-foreground px-4 py-3 tabular-nums">{priceFmt.format(Number(r.total))}</td>
                  <td className="hidden py-3 sm:table-cell">
                    <span
                      className={
                        r.status === "PENDING_SIGNATURE"
                          ? "bg-amber-500/12 text-amber-900 dark:text-amber-100 inline-flex rounded-full px-2 py-0.5 text-xs"
                          : "bg-muted text-muted-foreground inline-flex rounded-full px-2 py-0.5 text-xs"
                      }
                    >
                      {PAYMENT_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pagos/${r.id}`}>Ver</Link>
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
