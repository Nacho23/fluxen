"use client";

import { Building2, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";

export function CompanySwitcher({
  className,
}: Readonly<{
  className?: string;
}>) {
  const { data: session, status, update } = useSession();
  const companies = session?.companies ?? [];
  const activeId = session?.activeCompanyId ?? "";

  if (status === "loading") {
    return (
      <div
        className={cn("bg-sidebar-accent/50 h-10 animate-pulse rounded-lg", className)}
        aria-hidden
      />
    );
  }

  if (companies.length === 0) {
    return (
      <div
        className={cn(
          "text-sidebar-foreground/75 border-sidebar-border bg-sidebar-accent/45 rounded-lg border border-dashed px-3 py-2 text-xs leading-snug mt-2",
          className,
        )}
      >
        <p className="text-sidebar-foreground/85 flex items-start gap-2 font-medium">
          <Building2 className="text-sidebar-primary mt-0.5 size-3.5 shrink-0" aria-hidden />
          Aún no tienes empresas. Crea la primera desde el panel.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-sidebar-foreground/58 px-0.5 pt-2 text-[0.65rem] font-semibold tracking-widest uppercase">
        Empresa activa
      </p>
      <div className="relative">
        <select
          className="border-sidebar-border bg-background text-foreground focus-visible:ring-sidebar-primary/45 w-full cursor-pointer appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          value={activeId}
          aria-label="Empresa activa"
          onChange={async (e) => {
            await update({ activeCompanyId: e.target.value });
          }}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="text-sidebar-foreground/62 pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
      </div>
    </div>
  );
}
