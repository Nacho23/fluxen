import Link from "next/link";
import { Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { companyInitials } from "@/lib/branding/company-initials";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  companyName: string;
  coverSrc: string | null;
  avatarSrc: string | null;
  showPersonalizeLink: boolean;
}>;

/**
 * Cabecera de marca en la ruta `/dashboard` cuando la empresa usa el modo con marca.
 * Imágenes desde R2 (API interna) o URL externa según configuración.
 */
export function PanelBrandHero({ companyName, coverSrc, avatarSrc, showPersonalizeLink }: Props) {
  const displayName = companyName.trim() || "Empresa";
  const initials = companyInitials(displayName);

  return (
    <section
      className="border-border bg-card text-card-foreground overflow-hidden rounded-2xl border shadow-sm"
      aria-labelledby="dashboard-brand-title"
    >
      <div className="relative min-h-[11rem] md:min-h-[13rem]">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 size-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/12 to-muted/80"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 p-6 pb-7 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="flex min-w-0 flex-1 items-end gap-4">
            <div
              className={cn(
                "ring-background bg-background shadow-md ring-4",
                avatarSrc ? "size-[4.25rem] shrink-0 overflow-hidden rounded-2xl" : "flex size-[4.25rem] shrink-0 items-center justify-center rounded-2xl",
              )}
              aria-label={avatarSrc ? undefined : `Iniciales de ${displayName}`}
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={`Logo de ${displayName}`}
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-primary text-lg font-bold tracking-tight" aria-hidden>
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0 pb-0.5">
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Panel
              </p>
              <h1
                id="dashboard-brand-title"
                className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl"
              >
                {displayName}
              </h1>
              <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">
                Resumen de tu espacio de trabajo. Los datos están filtrados por la empresa activa.
              </p>
            </div>
          </div>
          {showPersonalizeLink ? (
            <Button variant="secondary" size="sm" className="shrink-0 gap-2 self-start md:self-end" asChild>
              <Link href="/configuracion/preferencias">
                <Palette className="size-4" aria-hidden />
                Apariencia
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
