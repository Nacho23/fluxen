"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfileRow } from "@/lib/data/user-profile";
import { cn } from "@/lib/utils";
import { updateMyProfile } from "@/server/actions/user-profile";

export function UserProfileForm({
  initial,
}: Readonly<{
  initial: UserProfileRow;
}>) {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const res = await updateMyProfile(null, formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await update();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-8">
      <section className="border-border bg-card/60 max-w-2xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-4 text-sm font-semibold">Identificación</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={1}
              maxLength={200}
              defaultValue={initial.name}
              disabled={pending}
              autoComplete="name"
            />
            <p className="text-muted-foreground text-[0.7rem]">Campo obligatorio.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rut">RUT (Chile)</Label>
            <Input
              id="rut"
              name="rut"
              maxLength={20}
              placeholder="12.345.678-9"
              defaultValue={initial.rut ?? ""}
              disabled={pending}
            />
            <p className="text-muted-foreground text-[0.7rem]">Opcional. Formato chileno con dígito verificador.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              maxLength={40}
              defaultValue={initial.phone ?? ""}
              disabled={pending}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <textarea
              id="address"
              name="address"
              rows={3}
              maxLength={2000}
              defaultValue={initial.address ?? ""}
              disabled={pending}
              className={cn(
                "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[4.5rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            />
          </div>
        </div>
      </section>

      <section className="border-border bg-card/60 max-w-2xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-1 text-sm font-semibold">Datos bancarios</h2>
        <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
          Opcional. Útiles para liquidaciones o reembolsos. Verifica los datos con tu banco.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bankName">Banco</Label>
            <Input
              id="bankName"
              name="bankName"
              maxLength={120}
              placeholder="Ej. Banco Estado"
              defaultValue={initial.bankName ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountType">Tipo de cuenta</Label>
            <Input
              id="bankAccountType"
              name="bankAccountType"
              maxLength={80}
              placeholder="Ej. Corriente, Vista, Ahorro"
              defaultValue={initial.bankAccountType ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountNumber">Número de cuenta</Label>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              maxLength={40}
              inputMode="numeric"
              defaultValue={initial.bankAccountNumber ?? ""}
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="text-muted-foreground text-xs">
          <span className="font-medium">Correo (inicio de sesión):</span>{" "}
          <span className="text-foreground">{initial.email}</span>
        </div>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="gap-2" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Guardando…
            </>
          ) : (
            "Guardar perfil"
          )}
        </Button>
      </div>
    </form>
  );
}
