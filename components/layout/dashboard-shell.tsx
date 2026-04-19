"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { LogOut, Menu, Wrench, X } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { CompanySwitcher } from "@/components/layout/company-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { navItemsForSession } from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasCompanies = (session?.companies?.length ?? 0) > 0;
  const role = getActiveCompanyRole(session ?? null);
  const navItems = navItemsForSession(hasCompanies, role, session?.permissions);

  return (
    <div className="bg-background flex min-h-full flex-1">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="bg-background/70 fixed inset-0 z-40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "border-sidebar-border bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r shadow-[3px_0_32px_-12px_oklch(0.2_0.01_270_/_0.18)] md:static md:z-0 md:shadow-[4px_0_36px_-14px_oklch(0.2_0.01_270_/_0.16)]",
          mobileOpen ? "flex" : "hidden md:flex",
        )}
      >
        <div className="border-sidebar-border flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <Link
            href="/dashboard"
            className="text-sidebar-foreground group flex items-center gap-3 font-semibold tracking-tight"
            onClick={() => setMobileOpen(false)}
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
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="border-sidebar-border border-b px-3 pb-3">
          <CompanySwitcher />
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Principal">
          <p className="text-sidebar-foreground/58 px-3 pb-1 text-[0.65rem] font-semibold tracking-widest uppercase">
            {hasCompanies ? "Menú" : "Primer paso"}
          </p>
          {status === "loading" ? (
            <div className="bg-sidebar-accent/65 mx-3 h-10 animate-pulse rounded-xl" aria-hidden />
          ) : (
            navItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary/18 text-sidebar-primary ring-sidebar-primary/28 shadow-sm ring-1"
                      : "text-sidebar-foreground/88 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[1.05rem] shrink-0",
                      active ? "text-sidebar-primary" : "opacity-85",
                    )}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              );
            })
          )}
        </nav>

        <div className="border-sidebar-border flex flex-col gap-2 border-t px-3 pt-3 pb-2">
          {status === "authenticated" && session?.user?.email ? (
            <div className="px-1 pb-1">
              <p className="text-sidebar-foreground/52 mb-1 text-[0.6rem] font-semibold tracking-widest uppercase">
                Cuenta
              </p>
              <p className="text-sidebar-foreground/78 mb-1.5 truncate text-[0.7rem]" title={session.user.email}>
                {session.user.email}
              </p>
              <Link
                href="/perfil"
                onClick={() => setMobileOpen(false)}
                className="text-sidebar-primary hover:text-sidebar-primary/90 text-xs font-medium underline-offset-2 transition-colors hover:underline"
              >
                Mi perfil
              </Link>
            </div>
          ) : null}
        </div>

        <div className="border-sidebar-border flex flex-col gap-2 border-t p-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sidebar-foreground/58 px-1 text-[0.65rem] font-semibold tracking-widest uppercase">
              Apariencia
            </span>
            <ThemeToggle />
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 h-9 w-full justify-start gap-2 px-3 text-xs font-medium"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-3.5" aria-hidden />
            Cerrar sesión
          </Button>
          <Link
            href="/"
            className="text-sidebar-foreground/72 hover:text-sidebar-foreground inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-sidebar-accent/75"
          >
            Ir al inicio público
          </Link>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="bg-background/85 border-border supports-[backdrop-filter]:bg-background/70 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="bg-primary/16 text-primary ring-primary/22 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1">
              <Wrench className="size-3.5" aria-hidden />
            </span>
            <span className="truncate font-semibold">Fluxen</span>
          </div>
          <ThemeToggle className="ml-auto shrink-0" />
        </header>

        <main className="relative flex-1">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-20%,oklch(0.45_0.012_270_/_0.09),transparent_58%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-20%,oklch(0.5_0.018_270_/_0.11),transparent_58%)]"
            aria-hidden
          />
          <div className="relative p-4 md:p-7 lg:p-9">{children}</div>
        </main>
      </div>
    </div>
  );
}
