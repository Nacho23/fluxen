"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/login";
import { cn } from "@/lib/utils";

function safeCallbackUrl(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export function LoginForm({ className }: Readonly<{ className?: string }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    setRootError(null);
    const res = await signIn("credentials", {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      setRootError("Correo o contraseña incorrectos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-5", className)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@empresa.com"
          aria-invalid={!!form.formState.errors.email}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <span className="text-muted-foreground text-xs">¿Olvidaste la clave? (pronto)</span>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!form.formState.errors.password}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {rootError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/8 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
          {rootError}
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full gap-2 rounded-xl text-sm font-semibold shadow-[0_1px_0_oklch(1_0_0_/_0.12)_inset]"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando…
          </>
        ) : (
          "Entrar al panel"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Un mismo usuario puede administrar varias empresas; los datos de cada una quedan
        separados.
      </p>

      <p className="text-center text-xs">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground font-medium underline-offset-4 transition-colors hover:underline"
        >
          Volver al inicio
        </Link>
      </p>
    </form>
  );
}
