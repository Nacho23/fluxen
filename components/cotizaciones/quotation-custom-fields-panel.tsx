"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuotationCustomFieldRow } from "@/lib/data/quotation-custom-fields-public";
import { QUOTATION_CUSTOM_FIELD_TYPE_LABEL } from "@/lib/data/quotation-custom-fields-public";
import { cn } from "@/lib/utils";
import {
  createQuotationCustomField,
  deleteQuotationCustomField,
  updateQuotationCustomField,
} from "@/server/actions/quotation-custom-fields";

export function QuotationCustomFieldsPanel({
  initialFields,
  canCreate,
  canUpdate,
  canDelete,
}: Readonly<{
  initialFields: QuotationCustomFieldRow[];
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
    const res = await createQuotationCustomField(null, formData);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function onUpdate(fieldId: string, formData: FormData) {
    setError(null);
    setPending(fieldId);
    formData.set("id", fieldId);
    const res = await updateQuotationCustomField(null, formData);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este campo? Las cotizaciones ya guardadas conservan el valor en historial.")) {
      return;
    }
    setError(null);
    setPending(id);
    const res = await deleteQuotationCustomField(id);
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
      {error ? (
        <p className="text-destructive max-w-3xl text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {canCreate ? (
        <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
            <Plus className="text-primary size-4" aria-hidden />
            Nuevo campo
          </h2>
          <form action={onCreate} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-key">Clave interna</Label>
                <Input
                  id="new-key"
                  name="key"
                  required
                  maxLength={60}
                  placeholder="ej. orden_compra"
                  autoComplete="off"
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Solo para el sistema (exportaciones, API). Minúsculas y guión bajo.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-label">Etiqueta en el formulario</Label>
                <Input
                  id="new-label"
                  name="label"
                  required
                  maxLength={120}
                  placeholder="Ej. N° orden de compra"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-fieldType">Tipo</Label>
                <select
                  id="new-fieldType"
                  name="fieldType"
                  defaultValue="TEXT"
                  className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                >
                  {(Object.keys(QUOTATION_CUSTOM_FIELD_TYPE_LABEL) as Array<
                    keyof typeof QUOTATION_CUSTOM_FIELD_TYPE_LABEL
                  >).map((k) => (
                    <option key={k} value={k}>
                      {QUOTATION_CUSTOM_FIELD_TYPE_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" name="required" className="border-input size-4 rounded" />
                  Obligatorio al crear cotización
                </label>
              </div>
            </div>
            <Button type="submit" className="w-fit gap-2" disabled={pending === "create"}>
              {pending === "create" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Guardando…
                </>
              ) : (
                "Añadir campo"
              )}
            </Button>
          </form>
        </section>
      ) : null}

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Campos configurados</h2>
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Etiqueta</th>
                <th className="hidden py-3 font-medium sm:table-cell">Clave</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Obligatorio</th>
                {showActionsCol ? <th className="w-28 px-2 py-3 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {initialFields.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActionsCol ? 5 : 4}
                    className="text-muted-foreground px-4 py-8 text-center text-sm"
                  >
                    No hay campos personalizados.
                    {canCreate ? " Añade el primero arriba." : ""}
                  </td>
                </tr>
              ) : (
                initialFields.map((f) =>
                  editingId === f.id && canUpdate ? (
                    <tr key={f.id} className="border-border bg-muted/20 border-t">
                      <td colSpan={showActionsCol ? 5 : 4} className="p-4">
                        <form action={(fd) => onUpdate(f.id, fd)} className="flex flex-col gap-3">
                          <input type="hidden" name="id" value={f.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label>Clave interna</Label>
                              <p className="text-muted-foreground font-mono text-xs">{f.key}</p>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor={`label-${f.id}`}>Etiqueta</Label>
                              <Input
                                id={`label-${f.id}`}
                                name="label"
                                required
                                maxLength={120}
                                defaultValue={f.label}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`fieldType-${f.id}`}>Tipo</Label>
                              <select
                                id={`fieldType-${f.id}`}
                                name="fieldType"
                                defaultValue={f.fieldType}
                                className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                              >
                                {(Object.keys(QUOTATION_CUSTOM_FIELD_TYPE_LABEL) as Array<
                                  keyof typeof QUOTATION_CUSTOM_FIELD_TYPE_LABEL
                                >).map((k) => (
                                  <option key={k} value={k}>
                                    {QUOTATION_CUSTOM_FIELD_TYPE_LABEL[k]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end pb-2">
                              <label className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  name="required"
                                  defaultChecked={f.required}
                                  className="border-input size-4 rounded"
                                />
                                Obligatorio
                              </label>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="submit" size="sm" disabled={pending === f.id}>
                              {pending === f.id ? (
                                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                              ) : (
                                "Guardar"
                              )}
                            </Button>
                            <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={f.id} className="border-border border-t">
                      <td className="text-foreground px-4 py-3 font-medium">{f.label}</td>
                      <td className="text-muted-foreground hidden py-3 font-mono text-xs sm:table-cell">
                        {f.key}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {QUOTATION_CUSTOM_FIELD_TYPE_LABEL[f.fieldType]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            f.required
                              ? "bg-primary/12 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {f.required ? "Sí" : "No"}
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
                                disabled={pending === f.id}
                                onClick={() => setEditingId(f.id)}
                                aria-label={`Editar ${f.label}`}
                              >
                                <Pencil className="size-4" aria-hidden />
                              </Button>
                            ) : null}
                            {canDelete ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive size-9"
                                disabled={pending === f.id}
                                onClick={() => onDelete(f.id)}
                                aria-label={`Eliminar ${f.label}`}
                              >
                                {pending === f.id ? (
                                  <Loader2 className="size-4 animate-spin" aria-hidden />
                                ) : (
                                  <Trash2 className="size-4" aria-hidden />
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
