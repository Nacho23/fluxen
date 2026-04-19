import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

function LoginFormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
        <div className="bg-muted h-10 animate-pulse rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        <div className="bg-muted h-10 animate-pulse rounded-lg" />
      </div>
      <div className="bg-muted h-11 animate-pulse rounded-xl" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="border-border bg-card/95 text-card-foreground ring-border/60 w-full max-w-[26rem] space-y-8 rounded-2xl border p-8 shadow-lg ring-1 backdrop-blur-md dark:shadow-[0_24px_64px_-24px_oklch(0_0_0_/_0.45)]">
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <span className="bg-muted text-foreground ring-border inline-flex size-12 items-center justify-center rounded-2xl ring-1">
            <span className="text-lg font-bold tracking-tight">M</span>
          </span>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Entra con tu correo para administrar tus empresas y su operación diaria.
          </p>
        </div>
      </div>

      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
