"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { QuotationStatus } from "@/lib/data/quotation-status";
import { updateQuotationStatus } from "@/server/actions/quotations";

const FINAL: QuotationStatus[] = ["ACCEPTED", "REJECTED", "EXPIRED"];

export function QuotationStatusActions({
  quotationId,
  status,
  canUpdate = true,
}: Readonly<{
  quotationId: string;
  status: QuotationStatus;
  /** Si es false, no se muestran botones de aceptar/rechazar (solo lectura). */
  canUpdate?: boolean;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canDecide = !FINAL.includes(status);

  if (!canUpdate && canDecide) {
    return (
      <p className="text-muted-foreground text-xs leading-relaxed">
        No tienes permiso para registrar la respuesta del cliente. Si debe actualizarse el estado, pide a un
        usuario con permiso de edición en cotizaciones.
      </p>
    );
  }

  if (!canDecide) {
    return (
      <p className="text-muted-foreground text-xs leading-relaxed">
        {status === "ACCEPTED"
          ? "Esta cotización está registrada como aceptada."
          : status === "REJECTED"
            ? "Esta cotización está registrada como rechazada."
            : "Esta cotización está marcada como vencida."}
      </p>
    );
  }

  function run(next: "ACCEPTED" | "REJECTED") {
    if (
      !confirm(
        next === "ACCEPTED"
          ? "¿Confirmar que el cliente aceptó esta cotización?"
          : "¿Confirmar que el cliente rechazó esta cotización?",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateQuotationStatus({ quotationId, status: next });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        Cuando el cliente confirme por el canal que uses (correo, llamada, etc.), registra aquí el
        resultado.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="gap-2"
          disabled={pending}
          onClick={() => run("ACCEPTED")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
          Aceptada por el cliente
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pending}
          onClick={() => run("REJECTED")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <X className="size-4" aria-hidden />}
          Rechazada por el cliente
        </Button>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
