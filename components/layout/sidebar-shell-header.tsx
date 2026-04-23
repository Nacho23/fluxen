"use client";

import Link from "next/link";
import { Wrench, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { companyInitials } from "@/lib/branding/company-initials";
import { cn } from "@/lib/utils";

export function SidebarShellHeader({
  companyName,
  branded,
  coverSrc,
  avatarSrc,
  onMobileClose,
}: Readonly<{
  companyName: string | null;
  branded: boolean;
  coverSrc: string | null;
  avatarSrc: string | null;
  onMobileClose: () => void;
}>) {
  const displayName = companyName?.trim() || "Empresa";
  const initials = companyInitials(displayName);

  if (!branded) {
    return (
      <div className="border-sidebar-border flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <Link
          href="/dashboard"
          className="text-sidebar-foreground group flex items-center gap-3 font-semibold tracking-tight"
          onClick={onMobileClose}
        >
          <span className="bg-sidebar-primary/18 text-sidebar-primary ring-sidebar-primary/25 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1">
            <Wrench className="size-[1.125rem]" aria-hidden />
          </span>
          <span className="text-[0.95rem]">Fluxen</span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/80 md:hidden"
          onClick={onMobileClose}
          aria-label="Cerrar menú"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-sidebar-border shrink-0 border-b">
      <div className="relative h-[5.25rem] overflow-hidden">
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
            className="absolute inset-0 bg-gradient-to-br from-sidebar-primary/35 via-sidebar-accent/50 to-sidebar-primary/20"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/20 to-transparent"
          aria-hidden
        />
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className="text-sidebar-foreground/88 hover:text-sidebar-foreground absolute top-2.5 left-3 z-10 text-[0.65rem] font-semibold tracking-wide uppercase underline-offset-2 transition-colors hover:underline"
        >
          Fluxen
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/90 hover:bg-sidebar/30 absolute top-1.5 right-2 z-10 md:hidden"
          onClick={onMobileClose}
          aria-label="Cerrar menú"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex items-end gap-3 px-4 pb-3.5 pt-0">
        <div
          className={cn(
            "ring-sidebar-border bg-sidebar -mt-7 relative shrink-0 overflow-hidden rounded-2xl shadow-md ring-2",
            avatarSrc ? "size-[3.35rem]" : "flex size-[3.35rem] items-center justify-center",
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
            <span className="text-sidebar-primary text-sm font-bold tracking-tight" aria-hidden>
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pb-0.5">
          <p className="text-sidebar-foreground truncate text-sm font-semibold leading-tight tracking-tight">
            {displayName}
          </p>
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="text-sidebar-primary/90 hover:text-sidebar-primary mt-1 inline-block text-xs font-medium underline-offset-2 transition-colors hover:underline"
          >
            Ir al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
