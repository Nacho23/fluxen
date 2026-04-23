"use client";

import { Building2, Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompany } from "@/server/actions/company";

export function CompanyNewCompanySection() {
  const router = useRouter();
  const { update } = useSession();
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  async function onCreate(formData: FormData) {
    setCreateError(null);
    setCreatePending(true);
    try {
      const res = await createCompany(null, formData);
      if (!res.ok) {
        setCreateError(res.error);
        return;
      }
      await update({ activeCompanyId: res.companyId });
      router.refresh();
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <section className="border-primary/20 bg-card/80 ring-primary/10 w-full max-w-lg rounded-2xl border p-6 shadow-sm ring-1">
      <div className="mb-4 flex items-start gap-3">
        <span className="bg-primary/12 text-primary ring-primary/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
          <Plus className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-foreground font-semibold tracking-tight">Nueva empresa</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Crea otro espacio de trabajo independiente. Serás el propietario y podrás cambiar entre
            empresas desde el menú lateral.
          </p>
        </div>
      </div>

      <form action={onCreate} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-company-name">Nombre de la empresa</Label>
          <Input
            id="new-company-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Ej. Mantenimiento Norte"
            disabled={createPending}
          />
        </div>
        {createError ? (
          <p className="text-destructive text-sm" role="alert">
            {createError}
          </p>
        ) : null}
        <Button type="submit" className="w-full gap-2 rounded-xl font-semibold" disabled={createPending}>
          {createPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creando…
            </>
          ) : (
            <>
              <Building2 className="size-4" aria-hidden />
              Crear empresa y cambiar a ella
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
