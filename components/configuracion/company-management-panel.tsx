"use client";

import { Building2, Loader2, Pencil, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompany, updateActiveCompany } from "@/server/actions/company";

export function CompanyManagementPanel({
  companyName,
  companySlug,
  quoteCodePrefix,
  quoteCodePadding,
}: Readonly<{
  companyName: string;
  companySlug: string;
  quoteCodePrefix: string;
  quoteCodePadding: number;
}>) {
  const router = useRouter();
  const { update } = useSession();
  const [editError, setEditError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [createPending, setCreatePending] = useState(false);

  async function onUpdate(formData: FormData) {
    setEditError(null);
    setEditPending(true);
    try {
      const res = await updateActiveCompany(null, formData);
      if (!res.ok) {
        setEditError(res.error);
        return;
      }
      await update();
      router.refresh();
    } finally {
      setEditPending(false);
    }
  }

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
    <div id="empresas" className="space-y-8 scroll-mt-8">
      <section className="border-border bg-card/60 max-w-xl rounded-xl border p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <span className="bg-primary/10 text-primary ring-primary/15 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
            <Pencil className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-foreground text-sm font-semibold">Empresa activa</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Nombre e identificador en URL. Solo visible para el propietario.
            </p>
          </div>
        </div>

        <form action={onUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nombre</Label>
            <Input
              id="org-name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={companyName}
              disabled={editPending}
            />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Identificador (URL)</p>
            <p className="text-foreground font-mono text-sm">{companySlug}</p>
            <p className="text-muted-foreground text-[0.7rem] leading-relaxed">
              Se actualiza al guardar el nombre si hace falta mantenerlo único.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quoteCodePrefix">Prefijo N° cotización</Label>
              <Input
                id="quoteCodePrefix"
                name="quoteCodePrefix"
                required
                maxLength={20}
                defaultValue={quoteCodePrefix}
                disabled={editPending}
                placeholder="COT"
                className="font-mono"
              />
              <p className="text-muted-foreground text-[0.7rem] leading-relaxed">
                Se usa antes del guion (ej. COT → COT-00001).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteCodePadding">Cifras del número</Label>
              <Input
                id="quoteCodePadding"
                name="quoteCodePadding"
                type="number"
                required
                min={3}
                max={10}
                defaultValue={quoteCodePadding}
                disabled={editPending}
              />
              <p className="text-muted-foreground text-[0.7rem] leading-relaxed">
                Relleno con ceros a la izquierda para el correlativo.
              </p>
            </div>
          </div>
          {editError ? (
            <p className="text-destructive text-sm" role="alert">
              {editError}
            </p>
          ) : null}
          <Button type="submit" disabled={editPending} className="gap-2">
            {editPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </form>
      </section>

      <section className="border-primary/20 bg-card/80 ring-primary/10 max-w-xl rounded-2xl border p-6 shadow-sm ring-1">
        <div className="mb-4 flex items-start gap-3">
          <span className="bg-primary/12 text-primary ring-primary/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
            <Plus className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-foreground font-semibold tracking-tight">Nueva empresa</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Crea otro espacio de trabajo independiente. Serás el propietario y podrás cambiar
              entre empresas desde el menú lateral.
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
    </div>
  );
}
