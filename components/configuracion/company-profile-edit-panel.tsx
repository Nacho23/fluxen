"use client";

import { Loader2, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateActiveCompany } from "@/server/actions/company";

type CompanyProfileFields = {
  address: string | null;
  phone: string | null;
  legalRepresentative: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  rut: string | null;
  businessName: string | null;
};

export function CompanyProfileEditPanel({
  companyName,
  companySlug,
  quoteCodePrefix,
  quoteCodePadding,
  profile,
}: Readonly<{
  companyName: string;
  companySlug: string;
  quoteCodePrefix: string;
  quoteCodePadding: number;
  profile: CompanyProfileFields;
}>) {
  const router = useRouter();
  const { update } = useSession();
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

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

  return (
    <section className="border-border bg-card/60 w-full max-w-2xl rounded-xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="bg-primary/10 text-primary ring-primary/15 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
          <Pencil className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-foreground text-sm font-semibold">Ficha de la empresa</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Nombre, identificador en URL y datos comerciales. Solo editable por el propietario.
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

        <div className="border-border space-y-4 border-t pt-5">
          <h3 className="text-foreground text-sm font-semibold">Datos empresa</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyRut">RUT</Label>
              <Input
                id="companyRut"
                name="rut"
                maxLength={20}
                defaultValue={profile.rut ?? ""}
                disabled={editPending}
                placeholder="Ej. 76.123.456-7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Razón social</Label>
              <Input
                id="businessName"
                name="businessName"
                maxLength={200}
                defaultValue={profile.businessName ?? ""}
                disabled={editPending}
                placeholder="Ej. Servicios SpA"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="legalRepresentative">Representante legal</Label>
              <Input
                id="legalRepresentative"
                name="legalRepresentative"
                maxLength={200}
                defaultValue={profile.legalRepresentative ?? ""}
                disabled={editPending}
                placeholder="Nombre completo"
              />
            </div>
          </div>
          <h3 className="text-foreground text-sm font-semibold">Datos de contacto</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyAddress">Dirección</Label>
              <textarea
                id="companyAddress"
                name="address"
                rows={3}
                maxLength={5000}
                defaultValue={profile.address ?? ""}
                disabled={editPending}
                placeholder="Calle, número, oficina…"
                className={cn(
                  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[5rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyPhone">Teléfono</Label>
              <Input
                id="companyPhone"
                name="phone"
                maxLength={50}
                defaultValue={profile.phone ?? ""}
                disabled={editPending}
                placeholder="Ej. +56 9 1234 5678"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyEmail">Correo electrónico</Label>
              <Input
                id="companyEmail"
                name="companyEmail"
                type="email"
                autoComplete="organization"
                maxLength={254}
                defaultValue={profile.email ?? ""}
                disabled={editPending}
                placeholder="contacto@empresa.cl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyWebsite">Sitio web</Label>
              <Input
                id="companyWebsite"
                name="website"
                inputMode="url"
                maxLength={500}
                defaultValue={profile.website ?? ""}
                disabled={editPending}
                placeholder="https://www.empresa.cl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCity">Ciudad</Label>
              <Input
                id="companyCity"
                name="city"
                maxLength={120}
                defaultValue={profile.city ?? ""}
                disabled={editPending}
                placeholder="Ej. Santiago"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCountry">País</Label>
              <Input
                id="companyCountry"
                name="country"
                maxLength={100}
                defaultValue={profile.country ?? ""}
                disabled={editPending}
                placeholder="Chile"
              />
            </div>
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
  );
}
