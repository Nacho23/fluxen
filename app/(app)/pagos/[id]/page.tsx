import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageHeader } from "@/components/layout/page-header";
import { SignPaymentButton } from "@/components/pagos/sign-payment-button";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { PAYMENT_METHOD_LABEL } from "@/lib/data/payment-method";
import { PAYMENT_STATUS_LABEL } from "@/lib/data/payment-status";
import { getPaymentForCompany } from "@/lib/data/payments";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function PagoDetallePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!session?.activeCompanyId || !userId) {
    redirect("/dashboard");
  }

  const payment = await getPaymentForCompany(id, session.activeCompanyId);
  if (!payment) {
    notFound();
  }

  const canReadPagos = await sessionHasPermission(session, "pagos", "read");
  const isBeneficiary = payment.workerUserId === userId;
  if (!canReadPagos && !isBeneficiary) {
    redirect("/pagos");
  }

  const isRegistrar = await sessionHasPermission(session, "pagos", "create");

  const canSign = isBeneficiary && payment.status === "PENDING_SIGNATURE";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Detalle del pago"
          description={`Empresa: ${payment.company.name}`}
        />
        <Button variant="outline" asChild className="w-fit shrink-0">
          <Link href="/pagos">Volver al listado</Link>
        </Button>
      </div>

      <div className="border-border bg-card/60 max-w-2xl space-y-6 rounded-xl border p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Estado</dt>
            <dd className="mt-1">
              <span
                className={
                  payment.status === "PENDING_SIGNATURE"
                    ? "bg-amber-500/12 text-amber-900 dark:text-amber-100 inline-flex rounded-full px-2 py-0.5 text-sm font-medium"
                    : "bg-muted text-muted-foreground inline-flex rounded-full px-2 py-0.5 text-sm font-medium"
                }
              >
                {PAYMENT_STATUS_LABEL[payment.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Forma de pago</dt>
            <dd className="text-foreground mt-1 font-medium">{PAYMENT_METHOD_LABEL[payment.paymentMethod]}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Trabajador</dt>
            <dd className="text-foreground mt-1">
              <span className="font-medium">{payment.worker.name}</span>
              <span className="text-muted-foreground block text-sm">{payment.worker.email}</span>
            </dd>
          </div>
          {isRegistrar ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Registrado por</dt>
              <dd className="text-foreground mt-1 text-sm">
                {payment.recordedBy.name} ({payment.recordedBy.email})
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Fecha del servicio
            </dt>
            <dd className="text-foreground mt-1">
              {payment.serviceDate
                ? new Intl.DateTimeFormat("es-CL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(payment.serviceDate)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Fecha de registro</dt>
            <dd className="text-foreground mt-1">
              {new Intl.DateTimeFormat("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(payment.createdAt)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Actividad realizada</dt>
            <dd className="text-foreground mt-1 whitespace-pre-wrap">{payment.activityDescription}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Monto</dt>
            <dd className="text-foreground mt-1 tabular-nums">{priceFmt.format(Number(payment.amount))}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Propina</dt>
            <dd className="text-foreground mt-1 tabular-nums">{priceFmt.format(Number(payment.tip))}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total</dt>
            <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
              {priceFmt.format(Number(payment.total))}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Código de transacción
            </dt>
            <dd className="text-foreground mt-1 font-mono text-sm">
              {payment.transactionCode?.trim() ? payment.transactionCode : "—"}
            </dd>
          </div>
          {payment.status === "SIGNED" && payment.signedAt ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Firmado</dt>
              <dd className="text-foreground mt-1 text-sm">
                {new Intl.DateTimeFormat("es-CL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(payment.signedAt)}
                {payment.signedBy ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — {payment.signedBy.name}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>

        {canSign ? (
          <div className="border-border border-t pt-6">
            <SignPaymentButton paymentId={payment.id} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
