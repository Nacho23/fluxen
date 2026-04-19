"use client";

import { ClientKind } from "@/lib/prisma/enums-public";
import { Loader2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClientFormModal } from "@/components/clientes/client-form-modal";
import { Button } from "@/components/ui/button";
import { CLIENT_KIND_LABEL } from "@/lib/data/client-kind";
import type { ClientRow } from "@/lib/data/company-clients";
import { deleteCompanyClient } from "@/server/actions/clients";

export function ClientsPanel({
  initialClients,
  canCreate,
  canUpdate,
  canDelete,
}: Readonly<{
  initialClients: ClientRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(c: ClientRow) {
    setEditing(c);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function onDelete(id: string, label: string) {
    if (!confirm(`¿Eliminar a «${label}»?`)) return;
    setError(null);
    setPending(id);
    const res = await deleteCompanyClient(id);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const showActionsCol = canUpdate || canDelete;

  return (
    <div className="space-y-8">
      {canCreate ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" className="gap-2" onClick={openCreate}>
            <UserPlus className="size-4" aria-hidden />
            Nuevo cliente
          </Button>
        </div>
      ) : null}

      <ClientFormModal
        open={modalOpen}
        onClose={closeModal}
        onSuccess={() => router.refresh()}
        initial={editing}
      />

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Listado</h2>
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="hidden py-3 font-medium md:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="hidden py-3 font-medium sm:table-cell">Teléfono</th>
                {showActionsCol ? <th className="w-28 px-2 py-3 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {initialClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActionsCol ? 5 : 4}
                    className="text-muted-foreground px-4 py-8 text-center text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Plus className="text-muted-foreground/80 size-8" aria-hidden />
                      <span>Aún no hay clientes registrados.</span>
                      {canCreate ? (
                        <Button type="button" variant="secondary" size="sm" className="mt-1 gap-2" onClick={openCreate}>
                          Crear el primero
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                initialClients.map((c) => (
                  <tr key={c.id} className="border-border border-t">
                    <td className="text-foreground px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      {c.rut ? (
                        <div className="text-muted-foreground mt-0.5 text-xs">RUT {c.rut}</div>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground hidden py-3 text-sm md:table-cell">
                      {CLIENT_KIND_LABEL[c.kind as ClientKind]}
                    </td>
                    <td className="text-foreground px-4 py-3 break-all">{c.email ?? "—"}</td>
                    <td className="text-muted-foreground hidden py-3 sm:table-cell">{c.phone ?? "—"}</td>
                    {showActionsCol ? (
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          {canUpdate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9"
                              disabled={pending === c.id}
                              onClick={() => openEdit(c)}
                              aria-label={`Editar ${c.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive size-9"
                              disabled={pending === c.id}
                              onClick={() => onDelete(c.id, c.name)}
                              aria-label={`Eliminar ${c.name}`}
                            >
                              {pending === c.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
