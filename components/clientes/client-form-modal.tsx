"use client";

import { ClientKind } from "@prisma/client";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLIENT_KIND_LABEL } from "@/lib/data/client-kind";
import type { ClientRow } from "@/lib/data/company-clients";
import { cn } from "@/lib/utils";
import { createCompanyClient, updateCompanyClient } from "@/server/actions/clients";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  /** Si se pasa, modo edición; si no, alta. */
  initial: ClientRow | null;
  /** Tras guardar correctamente (crear o editar). */
  onSuccess?: () => void;
  /** Tras crear correctamente (solo alta). */
  onCreated?: (client: ClientRow) => void;
}>;

export function ClientFormModal({ open, onClose, initial, onSuccess, onCreated }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<ClientKind>(ClientKind.PERSON);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rut, setRut] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setKind(initial.kind);
      setName(initial.name);
      setEmail(initial.email ?? "");
      setPhone(initial.phone ?? "");
      setRut(initial.rut ?? "");
      setNotes(initial.notes ?? "");
    } else {
      setKind(ClientKind.PERSON);
      setName("");
      setEmail("");
      setPhone("");
      setRut("");
      setNotes("");
    }
  }, [open, initial]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (initial) {
        const res = await updateCompanyClient({
          id: initial.id,
          kind,
          name,
          email,
          phone: phone.trim() || null,
          rut: rut.trim() || null,
          notes: notes.trim() || null,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onSuccess?.();
        onClose();
      } else {
        const res = await createCompanyClient({
          kind,
          name,
          email,
          phone: phone.trim() || null,
          rut: rut.trim() || null,
          notes: notes.trim() || null,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onCreated?.(res.client);
        onSuccess?.();
        onClose();
      }
    } finally {
      setPending(false);
    }
  }

  const title = initial ? "Editar cliente" : "Nuevo cliente";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="border-border bg-card relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-xl">
        <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="text-foreground text-base font-semibold tracking-tight">{title}</h2>
          <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 px-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="client-kind">Tipo</Label>
              <select
                id="client-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as ClientKind)}
                className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
              >
                <option value={ClientKind.PERSON}>{CLIENT_KIND_LABEL[ClientKind.PERSON]}</option>
                <option value={ClientKind.ORGANIZATION}>{CLIENT_KIND_LABEL[ClientKind.ORGANIZATION]}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-name">
                {kind === ClientKind.PERSON ? "Nombre completo" : "Nombre o razón social"}
              </Label>
              <Input
                id="client-name"
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === ClientKind.PERSON ? "Ej. Ana Pérez Soto" : "Ej. Comercial Fuego Ltda."}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-email">Correo electrónico (opcional)</Label>
              <Input
                id="client-email"
                type="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@ejemplo.cl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="client-phone">Teléfono (opcional)</Label>
                <Input
                  id="client-phone"
                  type="tel"
                  maxLength={50}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 …"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-rut">RUT (opcional)</Label>
                <Input
                  id="client-rut"
                  maxLength={20}
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12.345.678-5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-notes">Notas (opcional)</Label>
              <textarea
                id="client-notes"
                rows={3}
                maxLength={5000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn(
                  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[5rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              />
            </div>

            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="border-border mt-auto flex flex-wrap gap-2 border-t px-5 py-4">
            <Button type="submit" className="gap-2" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Guardando…
                </>
              ) : initial ? (
                "Guardar cambios"
              ) : (
                "Crear cliente"
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
