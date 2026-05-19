"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  WORK_ORDER_ALLOWED_TRANSITIONS,
  WORK_ORDER_STATUS_LABEL,
  isWorkOrderClosed,
} from "@/lib/data/work-order-status";
import type { CompanyMemberOption } from "@/lib/data/work-orders";
import type { WorkOrderStatus } from "@/lib/prisma/enums-public";
import { updateWorkOrderStatus } from "@/server/actions/work-orders";

const selectClassName =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

export function WorkOrderStatusActions({
  workOrderId,
  currentStatus,
  assignedUserId,
  members,
  canAssign,
}: Readonly<{
  workOrderId: string;
  currentStatus: WorkOrderStatus;
  assignedUserId: string | null;
  members: CompanyMemberOption[];
  /** Si true, puede cambiar el trabajador asignado. Requiere permiso `ordenes:update`. */
  canAssign: boolean;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<WorkOrderStatus>(currentStatus);
  const [assignee, setAssignee] = useState(assignedUserId ?? "");
  const [note, setNote] = useState("");

  if (isWorkOrderClosed(currentStatus)) {
    return (
      <div className="border-border rounded-lg border p-4">
        <p className="text-foreground text-sm font-medium">Estado de la orden</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Esta orden está cerrada ({WORK_ORDER_STATUS_LABEL[currentStatus]}).
        </p>
      </div>
    );
  }

  const allowed = WORK_ORDER_ALLOWED_TRANSITIONS[currentStatus];
  const options = [currentStatus, ...allowed.filter((s) => s !== currentStatus)];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateWorkOrderStatus({
        id: workOrderId,
        status,
        assignedUserId: assignee || null,
        note: note.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNote("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="border-border space-y-4 rounded-lg border p-4">
      <p className="text-foreground text-sm font-medium">Cambiar estado</p>

      <FormField id="wo-status" label="Nuevo estado">
        <select
          id="wo-status"
          value={status}
          onChange={(ev) => setStatus(ev.target.value as WorkOrderStatus)}
          className={selectClassName}
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {WORK_ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </FormField>

      {(status === "ASSIGNED" || status === "IN_PROGRESS" || assignee) && (
        <div className="space-y-2">
          <Label htmlFor="wo-assignee">Trabajador</Label>
          {canAssign ? (
            <select
              id="wo-assignee"
              value={assignee}
              onChange={(ev) => setAssignee(ev.target.value)}
              className={selectClassName}
              required={status === "ASSIGNED"}
            >
              <option value="">Sin asignar</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-foreground text-sm">
              {members.find((m) => m.userId === assignee)?.name ?? "—"}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="wo-note">Nota (opcional)</Label>
        <textarea
          id="wo-note"
          rows={2}
          value={note}
          onChange={(ev) => setNote(ev.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="Motivo del cambio…"
        />
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Guardar cambio
      </Button>
    </form>
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
