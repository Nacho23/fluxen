import Link from "next/link";

import type { CalendarPlacedItem } from "@/lib/agenda/calendar-placement";
import { WEEKDAY_LABELS_SHORT } from "@/lib/agenda/calendar-utils";
import { AGENDA_SOURCE_LABEL } from "@/lib/data/agenda-labels";
import { cn } from "@/lib/utils";

export type MonthGridCellSerialized = {
  key: string;
  dayNumber: number;
  inMonth: boolean;
};

export type DayPlacementSerialized = {
  visible: CalendarPlacedItem[];
  overflow: number;
};

function chipClass(item: CalendarPlacedItem): string {
  if (item.variant === "legacy") {
    return "border-border bg-muted/80 text-muted-foreground border border-dashed";
  }
  if (item.source === "QUOTATION") {
    return "bg-primary/15 text-primary border-primary/25 border";
  }
  if (item.source === "WORK_ORDER") {
    return "bg-amber-500/15 text-amber-700 border-amber-400/30 border dark:text-amber-400";
  }
  return "bg-muted/90 text-foreground border-border border";
}

export function AgendaMonthGrid({
  cells,
  placement,
  todayKey,
}: Readonly<{
  cells: MonthGridCellSerialized[];
  placement: Record<string, DayPlacementSerialized>;
  todayKey: string;
}>) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="bg-muted/50 grid grid-cols-7 gap-px border-b">
        {WEEKDAY_LABELS_SHORT.map((d) => (
          <div key={d} className="text-muted-foreground px-1 py-2 text-center text-xs font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="bg-border grid grid-cols-7 gap-px">
        {cells.map((cell) => {
          const p = placement[cell.key] ?? { visible: [], overflow: 0 };
          const isToday = cell.key === todayKey;
          return (
            <div
              key={cell.key}
              className={cn(
                "bg-card flex min-h-[5.5rem] flex-col gap-0.5 p-1 sm:min-h-[6.5rem] sm:p-1.5",
                !cell.inMonth && "bg-muted/30",
              )}
            >
              <div className="flex shrink-0 justify-between gap-1">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full tabular-nums",
                    isToday
                      ? "bg-primary text-primary-foreground text-xs font-bold"
                      : cell.inMonth
                        ? "text-foreground text-sm font-medium"
                        : "text-muted-foreground text-xs",
                  )}
                >
                  {cell.dayNumber}
                </span>
                {p.visible.length > 0 || p.overflow > 0 ? (
                  <Link
                    href={`/agenda?fecha=${cell.key}`}
                    className="text-primary hover:text-primary/80 text-[10px] font-medium sm:text-xs"
                  >
                    día
                  </Link>
                ) : null}
              </div>
              <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
                {p.visible.map((item) => (
                  <Link
                    key={`${cell.key}-${item.id}`}
                    href={item.href}
                    title={item.title}
                    className={cn(
                      "block max-w-full truncate rounded px-0.5 py-0.5 text-[10px] leading-tight font-medium sm:text-xs",
                      chipClass(item),
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                  </Link>
                ))}
                {p.overflow > 0 ? (
                  <Link
                    href={`/agenda?fecha=${cell.key}`}
                    className="text-muted-foreground block text-[10px] font-medium hover:underline sm:text-xs"
                  >
                    +{p.overflow} más
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground border-border border-t px-3 py-2 text-xs">
        <span className="font-medium text-foreground">Leyenda:</span>{" "}
        <span className="rounded border border-dashed bg-muted/50 px-1">Cotización sin evento</span> ·{" "}
        <span className="text-primary rounded bg-primary/15 px-1">{AGENDA_SOURCE_LABEL.QUOTATION}</span> ·{" "}
        <span className="rounded bg-muted px-1">{AGENDA_SOURCE_LABEL.MANUAL}</span> ·{" "}
        <span className="rounded bg-amber-500/15 px-1 text-amber-700 dark:text-amber-400">{AGENDA_SOURCE_LABEL.WORK_ORDER}</span>
      </p>
    </div>
  );
}
