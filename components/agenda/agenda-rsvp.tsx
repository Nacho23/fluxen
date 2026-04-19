"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ATTENDANCE_LABEL } from "@/lib/data/agenda-labels";
import type { AgendaAttendanceStatus } from "@/lib/prisma/enums-public";
import { respondAgendaInvitation } from "@/server/actions/agenda";

export function AgendaRsvp({
  eventId,
  myStatus,
}: Readonly<{
  eventId: string;
  myStatus: AgendaAttendanceStatus | null;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!myStatus) {
    return null;
  }

  if (myStatus !== "PENDING") {
    return (
      <p className="text-muted-foreground text-sm">
        Tu respuesta: <span className="text-foreground font-medium">{ATTENDANCE_LABEL[myStatus]}</span>
      </p>
    );
  }

  function respond(status: "ACCEPTED" | "DECLINED") {
    setError(null);
    startTransition(async () => {
      const res = await respondAgendaInvitation({ eventId, status });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-foreground text-sm font-medium">Tu invitación está pendiente</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-2"
          disabled={pending}
          onClick={() => respond("ACCEPTED")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Aceptar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => respond("DECLINED")}
        >
          Rechazar
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
