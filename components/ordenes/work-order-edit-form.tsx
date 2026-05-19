"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyMemberOption, WorkOrderLinkOption } from "@/lib/data/work-orders";
import { updateWorkOrder, deleteWorkOrder } from "@/server/actions/work-orders";

const selectClassName =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

function formatDateInput(d: Date | null): string {
  if (!d) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function WorkOrderEditForm({
  workOrder,
  members,
  quotations,
  canUpdate,
  canDelete,
}: Readonly<{
  workOrder: {
    id: string;
    title: string;
    description: string | null;
    assignedUserId: string | null;
    quotationId: string | null;
    scheduledAt: Date | null;
    status: string;
  };
  members: CompanyMemberOption[];
  quotations: WorkOrderLinkOption[];
  canUpdate: boolean;
  canDelete: boolean;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const closed = workOrder.status === "COMPLETED" || workOrder.status === "CANCELLED";

  const [title, setTitle] = useState(workOrder.title);
  const [description, setDescription] = useState(workOrder.description ?? "");
  const [assignedUserId, setAssignedUserId] = useState(workOrder.assignedUserId ?? "");
  const [quotationId, setQuotationId] = useState(workOrder.quotationId ?? "");
  const [scheduledAt, setScheduledAt] = useState(formatDateInput(workOrder.scheduledAt));

  if (!canUpdate) return null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (closed) return;
    setError(null);
    startTransition(async () => {
      const res = await updateWorkOrder({
        id: workOrder.id,
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
      router.refresh();
    });
  }

  function onDelete() {
    if (!canDelete || !confirm("¿Eliminar esta orden de trabajo? Esta acción no se puede deshacer.")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteWorkOrder(workOrder.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/ordenes");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="border-border space-y-4 rounded-lg border p-4">
      <p className="text-foreground text-sm font-medium">Editar orden</p>
      {closed ? (
        <p className="text-muted-foreground text-xs">La orden está cerrada; no se puede editar.</p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              required
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              maxLength={200}
            />
          </div>
          <EditTextarea id="edit-desc" label="Descripción" value={description} onChange={setDescription} />
          <EditSelect
            id="edit-assignee"
            label="Trabajador"
            value={assignedUserId}
            onChange={setAssignedUserId}
            options={members.map((m) => ({ id: m.userId, label: `${m.name} — ${m.email}` }))}
            emptyLabel="Sin asignar"
          />
          <div className="space-y-2">
            <Label htmlFor="edit-scheduled">Fecha programada</Label>
            <Input
              id="edit-scheduled"
              type="date"
              value={scheduledAt}
              onChange={(ev) => setScheduledAt(ev.target.value)}
            />
          </div>
          <EditSelect
            id="edit-quote"
            label="Cotización"
            value={quotationId}
            onChange={setQuotationId}
            options={quotations}
            emptyLabel="Ninguna"
          />
        </>
      )}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!closed ? (
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Guardar datos
          </Button>
        ) : null}
        {canDelete ? (
          <Button type="button" size="sm" variant="destructive" onClick={onDelete} disabled={pending}>
            Eliminar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function EditTextarea({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FormField id={id} label={label}>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </FormField>
  );
}

function EditSelect({
  id,
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  emptyLabel: string;
}) {
  return (
    <FormField id={id} label={label}>
      <select id={id} value={value} onChange={(ev) => onChange(ev.target.value)} className={selectClassName}>
        <option value="">{emptyLabel}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
