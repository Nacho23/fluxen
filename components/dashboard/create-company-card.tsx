"use client";

import { Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompany } from "@/server/actions/company";

export function CreateCompanyCard() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const res = await createCompany(null, formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await update({ activeCompanyId: res.companyId });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border-primary/25 bg-card/80 ring-primary/10 max-w-md rounded-2xl border p-6 shadow-sm ring-1">
      <div className="mb-4 flex items-start gap-3">
        <span className="bg-primary/12 text-primary ring-primary/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
          <Plus className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-foreground font-semibold tracking-tight">Crea tu primera empresa</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Cada empresa tiene su propio espacio: clientes, cotizaciones y órdenes no se mezclan
            entre sí. Podrás añadir más empresas después.
          </p>
        </div>
      </div>

      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nombre de la empresa</Label>
          <Input
            id="company-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Ej. Refrigeración López"
            disabled={pending}
          />
        </div>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full gap-2 rounded-xl font-semibold"
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creando…
            </>
          ) : (
            "Crear empresa y continuar"
          )}
        </Button>
      </form>
    </div>
  );
}
