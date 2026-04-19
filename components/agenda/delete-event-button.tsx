"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteAgendaEvent } from "@/server/actions/agenda";

export function DeleteEventButton({ eventId }: Readonly<{ eventId: string }>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm("¿Eliminar este evento de la agenda?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteAgendaEvent(eventId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/agenda");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-2"
        disabled={pending}
        onClick={onClick}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
        Eliminar evento
      </Button>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
