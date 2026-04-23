"use client";

import { Loader2, SlidersHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BrandingImageUploadRow } from "@/components/configuracion/branding-image-upload-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanySidebarSettings } from "@/server/actions/company";
import type { SidebarPanelStyle } from "@/lib/prisma/enums-public";

export function CompanyGeneralSettingsPanel({
  storageR2Ready,
  sidebarPanelStyle,
  sidebarCoverUrl,
  sidebarAvatarUrl,
  sidebarCoverHasR2,
  sidebarAvatarHasR2,
}: Readonly<{
  storageR2Ready: boolean;
  sidebarPanelStyle: SidebarPanelStyle;
  sidebarCoverUrl: string | null;
  sidebarAvatarUrl: string | null;
  sidebarCoverHasR2: boolean;
  sidebarAvatarHasR2: boolean;
}>) {
  const router = useRouter();
  const { update } = useSession();
  const [sidebarError, setSidebarError] = useState<string | null>(null);
  const [sidebarPending, setSidebarPending] = useState(false);

  async function afterBrandingUpload() {
    await update();
    router.refresh();
  }

  async function onSidebarSettings(formData: FormData) {
    setSidebarError(null);
    setSidebarPending(true);
    try {
      const res = await updateCompanySidebarSettings(null, formData);
      if (!res.ok) {
        setSidebarError(res.error);
        return;
      }
      await update();
      router.refresh();
    } finally {
      setSidebarPending(false);
    }
  }

  return (
    <section className="border-border bg-card/70 w-full max-w-2xl rounded-2xl border p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="bg-muted text-foreground ring-border flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
          <SlidersHorizontal className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-foreground font-semibold tracking-tight">Preferencias generales</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Afecta al menú lateral y a la cabecera de la ruta{" "}
            <span className="text-foreground font-mono text-[0.8rem]">/dashboard</span> para todos
            los miembros. Puedes subir imágenes a R2 o pegar una URL https; la subida tiene prioridad
            hasta que guardes una URL o quites la imagen.
          </p>
        </div>
      </div>

      <form action={onSidebarSettings} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-foreground mb-1 text-sm font-medium">
            Estilo del menú y del panel principal
          </legend>
          <div className="space-y-2.5">
            <label className="border-border hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2">
              <input
                type="radio"
                name="sidebarPanelStyle"
                value="STANDARD"
                defaultChecked={sidebarPanelStyle === "STANDARD"}
                disabled={sidebarPending}
                className="border-input text-primary mt-1 size-4 shrink-0"
              />
              <span>
                <span className="text-foreground block text-sm font-medium">Vista estándar</span>
                <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                  Menú lateral con Fluxen y página Panel con encabezado clásico. Aspecto neutro y
                  uniforme.
                </span>
              </span>
            </label>
            <label className="border-border hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2">
              <input
                type="radio"
                name="sidebarPanelStyle"
                value="BRANDED"
                defaultChecked={sidebarPanelStyle === "BRANDED"}
                disabled={sidebarPending}
                className="border-input text-primary mt-1 size-4 shrink-0"
              />
              <span>
                <span className="text-foreground block text-sm font-medium">Vista con marca</span>
                <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                  Portada, logo o iniciales y nombre destacados en el menú lateral y en la cabecera
                  del panel principal.
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="sidebarCoverUrl">Portada (banner)</Label>
          <BrandingImageUploadRow
            kind="cover"
            label="la portada"
            storageR2Ready={storageR2Ready}
            disabled={sidebarPending}
            onUploaded={afterBrandingUpload}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sidebarAvatarUrl">Logo o avatar</Label>
          <BrandingImageUploadRow
            kind="avatar"
            label="el logo"
            storageR2Ready={storageR2Ready}
            disabled={sidebarPending}
            onUploaded={afterBrandingUpload}
          />
        </div>

        {sidebarCoverHasR2 ||
        Boolean(sidebarCoverUrl?.trim()) ||
        sidebarAvatarHasR2 ||
        Boolean(sidebarAvatarUrl?.trim()) ? (
          <div className="border-border bg-muted/35 space-y-2 rounded-lg border px-3 py-2.5">
            <p className="text-foreground text-xs font-medium">Eliminar imágenes</p>
            <div className="flex flex-col gap-2">
              {sidebarCoverHasR2 || Boolean(sidebarCoverUrl?.trim()) ? (
                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    name="removeSidebarCover"
                    value="on"
                    disabled={sidebarPending}
                    className="border-input text-primary size-3.5 shrink-0 rounded"
                  />
                  Eliminar la portada
                </label>
              ) : null}
              {sidebarAvatarHasR2 || Boolean(sidebarAvatarUrl?.trim()) ? (
                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    name="removeSidebarAvatar"
                    value="on"
                    disabled={sidebarPending}
                    className="border-input text-primary size-3.5 shrink-0 rounded"
                  />
                  Eliminar el logo o avatar
                </label>
              ) : null}
            </div>
          </div>
        ) : null}

        {sidebarError ? (
          <p className="text-destructive text-sm" role="alert">
            {sidebarError}
          </p>
        ) : null}
        <Button type="submit" variant="secondary" disabled={sidebarPending} className="gap-2">
          {sidebarPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar preferencias de apariencia"
          )}
        </Button>
      </form>
    </section>
  );
}
