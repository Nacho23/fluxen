"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberRow } from "@/lib/data/company-members";
import { cn } from "@/lib/utils";
import { updateMemberUserProfile } from "@/server/actions/members";

export function EditMemberModal({
  member,
  open,
  onClose,
}: Readonly<{
  member: MemberRow | null;
  open: boolean;
  onClose: () => void;
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function onSubmit(formData: FormData) {
    if (!member) return;
    setError(null);
    setPending(true);
    const res = await updateMemberUserProfile(null, formData);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
  }

  if (!open || !member) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="bg-background/80 absolute inset-0 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="edit-member-title"
        className="border-border bg-card text-card-foreground relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-lg"
      >
        <div className="border-border flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 id="edit-member-title" className="text-foreground text-base font-semibold">
              Editar usuario
            </h2>
            <p className="text-muted-foreground mt-0.5 truncate text-sm">{member.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form
          action={onSubmit}
          key={member.id}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <input type="hidden" name="memberId" value={member.id} />
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Solo el nombre es obligatorio. El RUT debe ser válido si se informa.
            </p>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="modal-name">Nombre completo</Label>
                <Input
                  id="modal-name"
                  name="name"
                  required
                  minLength={1}
                  maxLength={200}
                  defaultValue={member.name}
                  disabled={pending}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-rut">RUT</Label>
                <Input
                  id="modal-rut"
                  name="rut"
                  maxLength={20}
                  defaultValue={member.rut ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-phone">Teléfono</Label>
                <Input
                  id="modal-phone"
                  name="phone"
                  type="tel"
                  maxLength={40}
                  defaultValue={member.phone ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="modal-address">Dirección</Label>
                <textarea
                  id="modal-address"
                  name="address"
                  rows={3}
                  maxLength={2000}
                  defaultValue={member.address ?? ""}
                  disabled={pending}
                  className={cn(
                    "border-input bg-background focus-visible:ring-ring min-h-[4rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none",
                  )}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="modal-bankName">Banco</Label>
                <Input
                  id="modal-bankName"
                  name="bankName"
                  maxLength={120}
                  defaultValue={member.bankName ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-bankAccountType">Tipo de cuenta</Label>
                <Input
                  id="modal-bankAccountType"
                  name="bankAccountType"
                  maxLength={80}
                  defaultValue={member.bankAccountType ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-bankAccountNumber">Número de cuenta</Label>
                <Input
                  id="modal-bankAccountNumber"
                  name="bankAccountNumber"
                  maxLength={40}
                  defaultValue={member.bankAccountNumber ?? ""}
                  disabled={pending}
                />
              </div>
            </div>
          </div>
          <div className="border-border flex justify-end gap-2 border-t px-5 py-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
