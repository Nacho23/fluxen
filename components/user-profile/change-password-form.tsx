"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPassword } from "@/server/actions/change-password";

export function ChangePasswordForm({
  hasPassword,
}: Readonly<{
  hasPassword: boolean;
}>) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      const res = await changeMyPassword(null, formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      const form = document.getElementById("change-password-form") as HTMLFormElement | null;
      form?.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-border bg-card/60 max-w-2xl rounded-xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <KeyRound className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <h2 className="text-foreground text-sm font-semibold">Contraseña</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {hasPassword
              ? "Usa una contraseña fuerte y no la reutilices en otros sitios."
              : "Define tu contraseña para iniciar sesión con correo y clave."}
          </p>
        </div>
      </div>

      <form id="change-password-form" action={onSubmit} className="space-y-4">
        {hasPassword ? (
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required={hasPassword}
              disabled={pending}
              minLength={1}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
            minLength={8}
            maxLength={128}
          />
          <p className="text-muted-foreground text-[0.7rem]">Mínimo 8 caracteres.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
            minLength={8}
            maxLength={128}
          />
        </div>

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-foreground text-sm" role="status">
            Contraseña actualizada correctamente.
          </p>
        ) : null}

        <Button type="submit" variant="secondary" className="gap-2" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Guardando…
            </>
          ) : hasPassword ? (
            "Cambiar contraseña"
          ) : (
            "Establecer contraseña"
          )}
        </Button>
      </form>
    </section>
  );
}
