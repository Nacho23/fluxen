"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceRow } from "@/lib/data/company-services";
import { SERVICE_ITEM_TYPE_LABEL } from "@/lib/data/service-item-type";
import { cn } from "@/lib/utils";
import { createService, deleteService, updateService } from "@/server/actions/services";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatPrice(value: string | null): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return priceFmt.format(n);
}

function typeLabel(itemType: ServiceRow["itemType"]): string {
  if (itemType == null) return "—";
  return SERVICE_ITEM_TYPE_LABEL[itemType];
}

export function ServicesPanel({
  initialServices,
  canCreate,
  canUpdate,
  canDelete,
}: Readonly<{
  initialServices: ServiceRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function onCreate(formData: FormData) {
    setError(null);
    setPending("create");
    const res = await createService(null, formData);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function onUpdate(serviceId: string, formData: FormData) {
    setError(null);
    setPending(serviceId);
    formData.set("id", serviceId);
    const res = await updateService(null, formData);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este servicio del catálogo?")) return;
    setError(null);
    setPending(id);
    const res = await deleteService(id);
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
      <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
          <Plus className="text-primary size-4" aria-hidden />
          Añadir servicio
        </h2>
        <form action={onCreate} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-name">Nombre</Label>
              <Input
                id="new-name"
                name="name"
                required
                maxLength={120}
                placeholder="Ej. Visita de diagnóstico"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-itemType">Tipo (opcional)</Label>
              <select
                id="new-itemType"
                name="itemType"
                defaultValue=""
                className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
              >
                <option value="">Sin tipo</option>
                <option value="SERVICIO">{SERVICE_ITEM_TYPE_LABEL.SERVICIO}</option>
                <option value="PRODUCTO">{SERVICE_ITEM_TYPE_LABEL.PRODUCTO}</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-desc">Descripción (opcional)</Label>
              <textarea
                id="new-desc"
                name="description"
                rows={2}
                maxLength={2000}
                placeholder="Detalle breve para el equipo y las cotizaciones"
                className={cn(
                  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[4rem] w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-price">Precio de referencia</Label>
              <Input
                id="new-price"
                name="defaultPrice"
                type="text"
                inputMode="decimal"
                placeholder="Ej. 45000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-unit">Unidad (opcional)</Label>
              <Input id="new-unit" name="unit" maxLength={40} placeholder="hora, visita, km…" />
            </div>
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-fit gap-2" disabled={pending === "create"}>
            {pending === "create" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Añadir al catálogo"
            )}
          </Button>
        </form>
      </section>
      ) : null}

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Catálogo</h2>
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="hidden py-3 font-medium md:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium">Precio ref.</th>
                <th className="hidden py-3 font-medium sm:table-cell">Unidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                {showActionsCol ? <th className="w-28 px-2 py-3 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {initialServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActionsCol ? 6 : 5}
                    className="text-muted-foreground px-4 py-8 text-center text-sm"
                  >
                    Aún no hay servicios.
                    {canCreate ? " Añade el primero arriba." : ""}
                  </td>
                </tr>
              ) : (
                initialServices.map((s) =>
                  editingId === s.id && canUpdate ? (
                    <tr key={s.id} className="border-border bg-muted/20 border-t">
                      <td colSpan={showActionsCol ? 6 : 5} className="p-4">
                        <form
                          action={(fd) => onUpdate(s.id, fd)}
                          className="flex flex-col gap-3"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor={`name-${s.id}`}>Nombre</Label>
                              <Input
                                id={`name-${s.id}`}
                                name="name"
                                required
                                maxLength={120}
                                defaultValue={s.name}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`itemType-${s.id}`}>Tipo (opcional)</Label>
                              <select
                                id={`itemType-${s.id}`}
                                name="itemType"
                                defaultValue={s.itemType ?? ""}
                                className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                              >
                                <option value="">Sin tipo</option>
                                <option value="SERVICIO">{SERVICE_ITEM_TYPE_LABEL.SERVICIO}</option>
                                <option value="PRODUCTO">{SERVICE_ITEM_TYPE_LABEL.PRODUCTO}</option>
                              </select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor={`desc-${s.id}`}>Descripción</Label>
                              <textarea
                                id={`desc-${s.id}`}
                                name="description"
                                rows={2}
                                maxLength={2000}
                                defaultValue={s.description ?? ""}
                                className="border-input bg-background focus-visible:ring-ring min-h-[3.5rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`price-${s.id}`}>Precio ref.</Label>
                              <Input
                                id={`price-${s.id}`}
                                name="defaultPrice"
                                type="text"
                                inputMode="decimal"
                                defaultValue={s.defaultPrice ?? ""}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`unit-${s.id}`}>Unidad</Label>
                              <Input
                                id={`unit-${s.id}`}
                                name="unit"
                                maxLength={40}
                                defaultValue={s.unit ?? ""}
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor={`active-${s.id}`}>Visible en cotizaciones</Label>
                              <select
                                id={`active-${s.id}`}
                                name="active"
                                defaultValue={s.active ? "true" : "false"}
                                className="border-input bg-background h-10 w-full max-w-xs rounded-lg border px-3 text-sm"
                              >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="submit" size="sm" disabled={pending === s.id}>
                              {pending === s.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                "Guardar"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={s.id} className="border-border border-t">
                      <td className="text-foreground px-4 py-3">
                        <div className="font-medium">{s.name}</div>
                        {s.description ? (
                          <div className="text-muted-foreground mt-0.5 line-clamp-2 max-w-md text-xs">
                            {s.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="text-muted-foreground hidden py-3 text-sm md:table-cell">
                        {typeLabel(s.itemType)}
                      </td>
                      <td className="text-foreground px-4 py-3 tabular-nums">
                        {formatPrice(s.defaultPrice)}
                      </td>
                      <td className="text-muted-foreground hidden py-3 sm:table-cell">
                        {s.unit ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            s.active
                              ? "bg-primary/12 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {s.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {showActionsCol ? (
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1">
                            {canUpdate ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9"
                                disabled={pending === s.id}
                                onClick={() => setEditingId(s.id)}
                                aria-label={`Editar ${s.name}`}
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
                                disabled={pending === s.id}
                                onClick={() => onDelete(s.id)}
                                aria-label={`Eliminar ${s.name}`}
                              >
                                {pending === s.id ? (
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
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
