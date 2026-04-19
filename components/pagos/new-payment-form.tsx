"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyMemberOption } from "@/lib/data/payments";
import { PAYMENT_METHOD_LABEL } from "@/lib/data/payment-method";
import type { PaymentMethod } from "@/lib/prisma/enums-public";
import { createPayment } from "@/server/actions/payments";

const METHODS: PaymentMethod[] = ["CASH", "TRANSFER", "CHECK", "CARD", "OTHER"];

function parseMoney(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (t === "") return 0;
  const n = Number(t);
  if (Number.isNaN(n)) return null;
  return n;
}

export function NewPaymentForm({
  members,
}: Readonly<{
  members: CompanyMemberOption[];
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [workerUserId, setWorkerUserId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TRANSFER");
  const [serviceDate, setServiceDate] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [tipStr, setTipStr] = useState("");
  const [transactionCode, setTransactionCode] = useState("");

  const totals = useMemo(() => {
    const amount = parseMoney(amountStr);
    const tip = parseMoney(tipStr);
    if (amount === null || tip === null) return { total: null as number | null, valid: false };
    return { total: Math.round((amount + tip) * 100) / 100, valid: true };
  }, [amountStr, tipStr]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = parseMoney(amountStr);
    const tip = parseMoney(tipStr);
    if (amount === null || tip === null) {
      setError("Revisa montos y propina (solo números)");
      return;
    }
    if (serviceDate && !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
      setError("Fecha del servicio no válida");
      return;
    }

    startTransition(async () => {
      const res = await createPayment({
        workerUserId,
        paymentMethod,
        serviceDate: serviceDate || undefined,
        activityDescription,
        amount,
        tip,
        transactionCode: transactionCode.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/pagos/${res.id}`);
      router.refresh();
    });
  }

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground border-border rounded-xl border bg-card/60 p-6 text-sm">
        No hay trabajadores en esta empresa. Invita usuarios en <strong>Usuarios</strong> antes de registrar
        pagos.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border-border bg-card/60 max-w-xl space-y-5 rounded-xl border p-6">
      <div className="space-y-2">
        <Label htmlFor="worker">Trabajador</Label>
        <select
          id="worker"
          required
          value={workerUserId}
          onChange={(ev) => setWorkerUserId(ev.target.value)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <option value="">Seleccionar…</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name} — {m.email}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Forma de pago</Label>
        <select
          id="method"
          value={paymentMethod}
          onChange={(ev) => setPaymentMethod(ev.target.value as PaymentMethod)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABEL[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="serviceDate">Fecha del servicio (opcional)</Label>
        <Input
          id="serviceDate"
          type="date"
          value={serviceDate}
          onChange={(ev) => setServiceDate(ev.target.value)}
        />
        <p className="text-muted-foreground text-xs">Solo si el trabajo fue en una fecha puntual.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity">Actividad realizada</Label>
        <textarea
          id="activity"
          required
          rows={4}
          value={activityDescription}
          onChange={(ev) => setActivityDescription(ev.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[96px] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="Ej. instalación eléctrica en bodega 3…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0"
            value={amountStr}
            onChange={(ev) => setAmountStr(ev.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tip">Propina (opcional)</Label>
          <Input
            id="tip"
            inputMode="decimal"
            placeholder="0"
            value={tipStr}
            onChange={(ev) => setTipStr(ev.target.value)}
          />
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg px-3 py-2 text-sm">
        <span className="text-muted-foreground">Total: </span>
        <span className="font-semibold tabular-nums">
          {totals.valid && totals.total !== null
            ? new Intl.NumberFormat("es-CL", {
                style: "currency",
                currency: "CLP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totals.total)
            : "—"}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx">Código de transacción (opcional)</Label>
        <Input
          id="tx"
          value={transactionCode}
          onChange={(ev) => setTransactionCode(ev.target.value)}
          placeholder="Ej. número de transferencia, voucher…"
          maxLength={200}
        />
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending || !totals.valid}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Registrar pago
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/pagos")} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
