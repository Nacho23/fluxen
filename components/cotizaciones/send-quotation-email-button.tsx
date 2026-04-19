"use client";

import { Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { sendQuotationEmail } from "@/server/actions/send-quotation-email";

export function SendQuotationEmailButton({
  quotationId,
  clientEmail,
}: Readonly<{
  quotationId: string;
  clientEmail: string | null;
}>) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await sendQuotationEmail(quotationId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(res.message);
    });
  }

  const canSend = Boolean(clientEmail?.trim());

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="gap-2"
        disabled={pending || !canSend}
        onClick={onClick}
        title={!canSend ? "Indica un correo en la ficha del cliente o en el historial de la cotización" : undefined}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Mail className="size-4" aria-hidden />
        )}
        Enviar cotización por correo
      </Button>
      <p className="text-muted-foreground text-xs">
        {canSend ? (
          <>
            Se usará el correo del cliente: <span className="text-foreground font-medium">{clientEmail}</span>
          </>
        ) : (
          "No hay correo en esta cotización. Añádelo editando al cliente en Clientes o en una nueva versión del documento."
        )}
      </p>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-foreground text-sm" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
