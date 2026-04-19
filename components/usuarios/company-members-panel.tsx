"use client";

import { CompanyRole } from "@/lib/prisma/enums-public";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditMemberModal } from "@/components/usuarios/edit-member-modal";
import { ORDERED_COMPANY_ROLES, rolesAssignableByAdmin } from "@/lib/auth/permissions";
import type { MemberRow } from "@/lib/data/company-members";
import { cn } from "@/lib/utils";
import {
  addCompanyMember,
  removeCompanyMember,
  updateCompanyMemberRole,
} from "@/server/actions/members";

export function CompanyMembersPanel({
  members,
  currentUserId,
  actorRole,
  roleLabels,
  canCreate,
  canUpdate,
  canDelete,
}: Readonly<{
  members: MemberRow[];
  currentUserId: string;
  actorRole: CompanyRole;
  roleLabels: Record<CompanyRole, string>;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}>) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);

  const addableRoles =
    actorRole === CompanyRole.OWNER
      ? [...ORDERED_COMPANY_ROLES]
      : rolesAssignableByAdmin();

  function canEditMemberRow(member: MemberRow) {
    if (actorRole === CompanyRole.OWNER) return true;
    if (
      actorRole === CompanyRole.ADMIN ||
      actorRole === CompanyRole.OPS_ADMIN ||
      actorRole === CompanyRole.FIELD
    ) {
      return (
        member.role === CompanyRole.OPS_ADMIN || member.role === CompanyRole.FIELD
      );
    }
    return false;
  }

  function roleOptionsForChange(): CompanyRole[] {
    if (actorRole === CompanyRole.OWNER) {
      return [...ORDERED_COMPANY_ROLES];
    }
    return rolesAssignableByAdmin();
  }

  async function onAdd(formData: FormData) {
    setFormError(null);
    const res = await addCompanyMember(null, formData);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    router.refresh();
  }

  async function onUpdateRole(memberId: string, formData: FormData) {
    setPendingId(memberId);
    formData.set("memberId", memberId);
    const res = await updateCompanyMemberRole(null, formData);
    setPendingId(null);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setFormError(null);
    router.refresh();
  }

  async function onRemove(memberId: string) {
    if (!confirm("¿Quitar a este usuario de la empresa?")) return;
    setPendingId(memberId);
    const res = await removeCompanyMember(memberId);
    setPendingId(null);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setFormError(null);
    router.refresh();
  }

  const showActionsCol = canUpdate || canDelete;

  return (
    <div className="space-y-8">
      {canCreate ? (
      <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-1 text-sm font-semibold">Añadir usuario</h2>
        <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
          Si el correo aún no tiene cuenta, se crea automáticamente. La contraseña inicial es la parte del
          correo antes de @ más <span className="font-mono">1234</span>. Puedes completar nombre, RUT y
          datos de contacto o banco al crear la cuenta (solo aplica a usuarios nuevos).
        </p>
        <form action={onAdd} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Correo</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                placeholder="correo@empresa.com"
                autoComplete="off"
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-44">
              <Label htmlFor="invite-role">Rol</Label>
              <select
                id="invite-role"
                name="role"
                required
                className="border-input bg-background ring-offset-background h-10 w-full rounded-lg border px-3 text-sm"
                defaultValue={addableRoles[0]}
              >
                {addableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="shrink-0">
              Añadir
            </Button>
          </div>

          <details className="group border-border rounded-lg border bg-muted/20 p-3">
            <summary className="text-foreground cursor-pointer text-sm font-medium marker:text-muted-foreground">
              Datos opcionales al crear cuenta nueva
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="inviteName">Nombre completo</Label>
                <Input
                  id="inviteName"
                  name="inviteName"
                  maxLength={200}
                  placeholder="Si se deja vacío, se usa la parte del correo antes de @"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteRut">RUT</Label>
                <Input id="inviteRut" name="inviteRut" maxLength={20} placeholder="12.345.678-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invitePhone">Teléfono</Label>
                <Input id="invitePhone" name="invitePhone" type="tel" maxLength={40} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="inviteAddress">Dirección</Label>
                <textarea
                  id="inviteAddress"
                  name="inviteAddress"
                  rows={2}
                  maxLength={2000}
                  className={cn(
                    "border-input bg-background focus-visible:ring-ring min-h-[3.5rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none",
                  )}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="inviteBankName">Banco</Label>
                <Input id="inviteBankName" name="inviteBankName" maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteBankAccountType">Tipo de cuenta</Label>
                <Input id="inviteBankAccountType" name="inviteBankAccountType" maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteBankAccountNumber">Número de cuenta</Label>
                <Input id="inviteBankAccountNumber" name="inviteBankAccountNumber" maxLength={40} />
              </div>
            </div>
          </details>
        </form>
      </section>
      ) : null}

      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Equipo</h2>
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                {showActionsCol ? (
                  <th className="w-[5.5rem] px-2 py-3 font-medium text-right">Acciones</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const editable = canEditMemberRow(m);
                const busy = pendingId === m.id;
                const isSelf = m.userId === currentUserId;
                const showRoleEditor = editable && canUpdate;
                const showPencil = editable && canUpdate;
                const showTrash = editable && canDelete && !isSelf;
                return (
                  <tr key={m.id} className="border-border border-t">
                    <td className="text-foreground px-4 py-3 align-top">
                      <div className="font-medium">{m.email}</div>
                      <div className="text-muted-foreground mt-0.5 text-xs">{m.name}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {showRoleEditor ? (
                        <form
                          action={(fd) => onUpdateRole(m.id, fd)}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="memberId" value={m.id} />
                          <select
                            name="role"
                            defaultValue={m.role}
                            disabled={busy}
                            className="border-input bg-background h-9 max-w-[14rem] rounded-lg border px-2 text-xs"
                          >
                            {roleOptionsForChange().map((r) => (
                              <option key={r} value={r}>
                                {roleLabels[r]}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="secondary" disabled={busy}>
                            {busy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Guardar"
                            )}
                          </Button>
                        </form>
                      ) : (
                        <span className="text-foreground text-sm">{roleLabels[m.role]}</span>
                      )}
                    </td>
                    {showActionsCol ? (
                      <td className="px-2 py-3 align-top">
                        {showPencil || showTrash ? (
                          <div className="flex items-center justify-end gap-0.5">
                            {showPencil ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9"
                                disabled={busy}
                                onClick={() => setEditingMember(m)}
                                aria-label={`Editar datos de ${m.email}`}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            ) : null}
                            {showTrash ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive size-9"
                                disabled={busy}
                                onClick={() => onRemove(m.id)}
                                aria-label={`Quitar ${m.email}`}
                              >
                                {busy ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {actorRole === CompanyRole.OWNER ? (
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Como propietario puedes{" "}
            <span className="text-foreground font-medium">cambiar el rol de cualquier miembro</span>, incluidos
            otros propietarios y administradores. Usa el selector y{" "}
            <span className="font-medium">Guardar</span>; el lápiz edita nombre, RUT y datos de contacto.
          </p>
        ) : actorRole === CompanyRole.ADMIN || actorRole === CompanyRole.OPS_ADMIN ? (
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Solo el propietario gestiona propietarios y administradores. Los demás roles con acceso a Usuarios
            suelen limitar invitaciones a operadores administrativos y operadores en terreno (según lo que
            configure el propietario en Permisos por rol).
          </p>
        ) : null}
      </section>

      <EditMemberModal
        member={editingMember}
        open={editingMember != null}
        onClose={() => setEditingMember(null)}
      />
    </div>
  );
}
