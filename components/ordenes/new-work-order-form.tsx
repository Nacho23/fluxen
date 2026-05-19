"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyMemberOption, WorkOrderLinkOption } from "@/lib/data/work-orders";
import { createWorkOrder } from "@/server/actions/work-orders";

const selectClassName =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

export function NewWorkOrderForm({
  members,
  quotations,
}: Readonly<{
  members: CompanyMemberOption[];
  quotations: WorkOrderLinkOption[];
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createWorkOrder({
        title,
        description: description.trim() || null,
        assignedUserId: assignedUserId || null,
        quotationId: quotationId || null,
        scheduledAt: scheduledAt || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/ordenes/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="border-border bg-card/60 max-w-xl space-y-5 rounded-xl border p-6">
      <FormField id="title" label="Título" required>
        <Input
          id="title"
          required
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          placeholder="Ej. Instalación eléctrica bodega 3"
          maxLength={200}
        />
      </FormField>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[96px] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="Detalle del trabajo a realizar…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignee">Trabajador asignado (opcional)</Label>
        <select
          id="assignee"
          value={assignedUserId}
          onChange={(ev) => setAssignedUserId(ev.target.value)}
          className={selectClassName}
        >
          <option value="">Sin asignar</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name} — {m.email}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs">
          Si asignas un trabajador, recibirá notificación en el panel y por correo (si está activo).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Fecha programada (opcional)</Label>
        <Input
          id="scheduledAt"
          type="date"
          value={scheduledAt}
          onChange={(ev) => setScheduledAt(ev.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quotation">Cotización (opcional)</Label>
        <select
          id="quotation"
          value={quotationId}
          onChange={(ev) => setQuotationId(ev.target.value)}
          className={selectClassName}
        >
          <option value="">Ninguna</option>
          {quotations.map((q) => (
            <option key={q.id} value={q.id}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Crear orden
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/ordenes")} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function FormField({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
    </div>
  );
}
