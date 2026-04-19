"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberRow } from "@/lib/data/company-members";
import { cn } from "@/lib/utils";
import { createAgendaEvent, updateAgendaEvent } from "@/server/actions/agenda";

function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function datetimeLocalToIso(value: string): string | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Props = Readonly<{
  members: MemberRow[];
  mode: "create" | "edit";
  eventId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialLocation?: string;
  initialStartAt?: string;
  initialEndAt?: string;
  initialAttendeeUserIds?: string[];
}>;

export function AgendaEventForm({
  members,
  mode,
  eventId,
  initialTitle = "",
  initialDescription = "",
  initialLocation = "",
  initialStartAt,
  initialEndAt,
  initialAttendeeUserIds = [],
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [startLocal, setStartLocal] = useState(() =>
    initialStartAt ? isoToDatetimeLocalValue(initialStartAt) : "",
  );
  const [endLocal, setEndLocal] = useState(() =>
    initialEndAt ? isoToDatetimeLocalValue(initialEndAt) : "",
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialAttendeeUserIds));

  const memberOptions = useMemo(() => members, [members]);

  function toggleUser(uid: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const startIso = datetimeLocalToIso(startLocal);
    const endIso = datetimeLocalToIso(endLocal);
    if (!startIso || !endIso) {
      setError("Indica fecha y hora de inicio y fin válidas.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      startAt: startIso,
      endAt: endIso,
      attendeeUserIds: [...selected],
    };

    startTransition(async () => {
      if (mode === "create") {
        const res = await createAgendaEvent(payload);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/agenda/${res.id}`);
        router.refresh();
        return;
      }
      if (!eventId) return;
      const res = await updateAgendaEvent({ ...payload, id: eventId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/agenda/${eventId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="border-border bg-card/60 max-w-2xl space-y-4 rounded-xl border p-5 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="evt-title">Título</Label>
          <Input
            id="evt-title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Visita técnica edificio Norte"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evt-desc">Descripción (opcional)</Label>
          <textarea
            id="evt-desc"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(
              "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[5rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evt-loc">Lugar (opcional)</Label>
          <Input
            id="evt-loc"
            maxLength={200}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Dirección o enlace"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="evt-start">Inicio</Label>
            <Input
              id="evt-start"
              type="datetime-local"
              required
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evt-end">Fin</Label>
            <Input
              id="evt-end"
              type="datetime-local"
              required
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border-border bg-card/60 max-w-2xl space-y-3 rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground text-sm font-semibold">Asistentes</h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Recibirán una invitación pendiente y podrán aceptarla o rechazarla desde el detalle del evento.
        </p>
        <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {memberOptions.length === 0 ? (
            <li className="text-muted-foreground text-sm">No hay otros miembros en la empresa.</li>
          ) : (
            memberOptions.map((m) => (
              <li key={m.userId}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(m.userId)}
                    onChange={() => toggleUser(m.userId)}
                    className="accent-primary"
                  />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground text-xs">{m.email}</span>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Guardando…
            </>
          ) : mode === "create" ? (
            "Crear evento"
          ) : (
            "Guardar cambios"
          )}
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href={mode === "edit" && eventId ? `/agenda/${eventId}` : "/agenda"}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
