"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";

import {
  ACTION_LABEL,
  APP_RESOURCES,
  editableRoles,
  type AppResource,
  type CompanyPermissionsMatrix,
  type CrudFlags,
  type EditableCompanyRole,
  type PermissionAction,
  RESOURCE_LABEL,
} from "@/lib/auth/company-permissions";
import { COMPANY_ROLE_LABEL } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { updateCompanyRolePermissions } from "@/server/actions/company-permissions";
import { cn } from "@/lib/utils";

const ACTIONS: PermissionAction[] = ["read", "create", "update", "delete"];

type EditableMatrix = Pick<
  CompanyPermissionsMatrix,
  "ADMIN" | "OPS_ADMIN" | "FIELD"
>;

export function CompanyPermissionsForm({
  initial,
}: Readonly<{
  initial: EditableMatrix;
}>) {
  const { update } = useSession();
  const [matrix, setMatrix] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(role: EditableCompanyRole, res: AppResource, action: PermissionAction) {
    setMatrix((prev) => {
      const cell = { ...prev[role][res] } as CrudFlags;
      const nextOn = !cell[action];
      cell[action] = nextOn;
      if (res === "pagos" || res === "ordenes") {
        if (action === "read" && !nextOn) {
          cell.readAll = false;
        }
        if (action === "read" && nextOn && cell.readAll === undefined) {
          cell.readAll = true;
        }
      }
      return {
        ...prev,
        [role]: {
          ...prev[role],
          [res]: cell,
        },
      };
    });
  }

  function toggleReadAll(role: EditableCompanyRole, res: "pagos" | "ordenes") {
    setMatrix((prev) => {
      const cell = { ...prev[role][res] } as CrudFlags;
      if (!cell.read) return prev;
      const cur = cell.readAll !== false;
      return {
        ...prev,
        [role]: {
          ...prev[role],
          [res]: { ...cell, readAll: !cur },
        },
      };
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateCompanyRolePermissions(matrix);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await update();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        El rol <span className="text-foreground font-medium">Propietario</span> siempre tiene acceso completo a
        todo. Aquí defines qué pueden ver y hacer los demás roles en cada módulo.
      </p>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="bg-muted/50 border-border border-b">
              <th className="text-muted-foreground px-3 py-2 font-medium">Módulo</th>
                {editableRoles.map((role) => (
                  <th key={role} className="text-foreground border-border border-l px-2 py-2 font-semibold">
                    {COMPANY_ROLE_LABEL[role]}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {APP_RESOURCES.map((res) => (
              <tr key={res} className="border-border border-t">
                <td className="text-foreground px-3 py-2 align-top font-medium">{RESOURCE_LABEL[res]}</td>
                {editableRoles.map((role) => (
                  <td key={`${role}-${res}`} className="border-border border-l px-2 py-2 align-top">
                    <div className="flex flex-col gap-1.5">
                      {ACTIONS.map((action) => {
                        const cell = matrix[role][res] as CrudFlags;
                        const on = cell[action];
                        return (
                          <label
                            key={action}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors",
                              on ? "bg-primary/10" : "hover:bg-muted/60",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={pending}
                              onChange={() => toggle(role, res, action)}
                              className="border-input size-3.5 rounded"
                            />
                            <span className="text-muted-foreground">{ACTION_LABEL[action]}</span>
                          </label>
                        );
                      })}
                      {res === "pagos" ? (
                        <ReadAllToggle
                          role={role}
                          resource="pagos"
                          label="Ver todos los pagos de la empresa"
                          matrix={matrix}
                          pending={pending}
                          onToggle={() => toggleReadAll(role, "pagos")}
                        />
                      ) : null}
                      {res === "ordenes" ? (
                        <ReadAllToggle
                          role={role}
                          resource="ordenes"
                          label="Ver todas las órdenes de la empresa"
                          matrix={matrix}
                          pending={pending}
                          onToggle={() => toggleReadAll(role, "ordenes")}
                        />
                      ) : null}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Guardar permisos
        </Button>
        <p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
          Los cambios aplican al instante para tu sesión; el resto del equipo al refrescar o al volver a entrar.
        </p>
      </div>
    </form>
  );
}

function ReadAllToggle({
  role,
  resource,
  label,
  matrix,
  pending,
  onToggle,
}: {
  role: EditableCompanyRole;
  resource: "pagos" | "ordenes";
  label: string;
  matrix: EditableMatrix;
  pending: boolean;
  onToggle: () => void;
}) {
  const cell = matrix[role][resource];
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2 rounded-md px-1 py-0.5 transition-colors",
        cell.read && cell.readAll !== false ? "bg-primary/10" : "hover:bg-muted/60",
      )}
    >
      <input
        type="checkbox"
        checked={cell.read && cell.readAll !== false}
        disabled={pending || !cell.read}
        onChange={onToggle}
        className="border-input mt-0.5 size-3.5 shrink-0 rounded"
      />
      <span className="text-muted-foreground leading-snug">{label}</span>
    </label>
  );
}
