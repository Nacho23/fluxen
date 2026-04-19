import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = Readonly<{
  mode: "mes" | "dia";
  monthHref: string;
  dayHref: string;
}>;

export function AgendaViewModeTabs({ mode, monthHref, dayHref }: Props) {
  return (
    <div
      className="border-border bg-muted/40 inline-flex rounded-lg border p-1"
      role="tablist"
      aria-label="Tipo de vista"
    >
      <Link
        href={monthHref}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          mode === "mes"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        role="tab"
        aria-selected={mode === "mes"}
      >
        Mes
      </Link>
      <Link
        href={dayHref}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          mode === "dia"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        role="tab"
        aria-selected={mode === "dia"}
      >
        Día
      </Link>
    </div>
  );
}
