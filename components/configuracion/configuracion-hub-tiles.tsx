import Link from "next/link";
import { Bell, ChevronRight, FileText, Pencil, SlidersHorizontal } from "lucide-react";

export function ConfiguracionHubTiles() {
  const tileClass =
    "border-border bg-card text-card-foreground hover:border-primary/35 hover:bg-muted/45 group flex items-center gap-3 rounded-xl border px-3.5 py-3 shadow-sm transition-colors";

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
      <Link href="/configuracion/ficha" className={tileClass}>
        <span className="bg-primary/12 text-primary ring-primary/18 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1">
          <Pencil className="size-[1.1rem]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-tight tracking-tight">
          Ficha de la empresa
        </span>
        <ChevronRight
          className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors"
          aria-hidden
        />
      </Link>
      <Link href="/configuracion/preferencias" className={tileClass}>
        <span className="bg-primary/12 text-primary ring-primary/18 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1">
          <SlidersHorizontal className="size-[1.1rem]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-tight tracking-tight">
          Preferencias generales
        </span>
        <ChevronRight
          className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors"
          aria-hidden
        />
      </Link>
      <Link href="/configuracion/cotizaciones-formato" className={tileClass}>
        <span className="bg-primary/12 text-primary ring-primary/18 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1">
          <FileText className="size-[1.1rem]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-tight tracking-tight">
          Formato de cotización
        </span>
        <ChevronRight
          className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors"
          aria-hidden
        />
      </Link>
      <Link href="/configuracion/notificaciones" className={tileClass}>
        <span className="bg-primary/12 text-primary ring-primary/18 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1">
          <Bell className="size-[1.1rem]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-tight tracking-tight">
          Notificaciones
        </span>
        <ChevronRight
          className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors"
          aria-hidden
        />
      </Link>
    </div>
  );
}
