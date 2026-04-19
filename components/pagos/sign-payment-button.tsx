"use client";

import { Loader2, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signPayment } from "@/server/actions/payments";

export function SignPaymentButton({ paymentId }: Readonly<{ paymentId: string }>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await signPayment(paymentId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" className="gap-2" disabled={pending} onClick={onClick}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PenLine className="size-4" aria-hidden />}
        Confirmar recepción (firma)
      </Button>
      <p className="text-muted-foreground text-xs">
        Al confirmar, declaras haber recibido el pago conforme a los datos indicados. En el futuro podrá usarse firma
        electrónica.
      </p>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
