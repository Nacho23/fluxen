import Link from "next/link";

import type { CalendarPlacedItem } from "@/lib/agenda/calendar-placement";
import { AGENDA_SOURCE_LABEL } from "@/lib/data/agenda-labels";
import { cn } from "@/lib/utils";

const timeFmt = new Intl.DateTimeFormat("es-CL", {
  hour: "2-digit",
  minute: "2-digit",
});

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
});

function cardClass(item: CalendarPlacedItem): string {
  if (item.variant === "legacy") {
    return "border-border border-dashed bg-muted/30";
  }
  if (item.source === "QUOTATION") {
    return "border-primary/25 bg-primary/[0.04] border";
  }
  return "border-border bg-card/60 border";
}

export function AgendaDayView({
  items,
  dayTitle,
}: Readonly<{
  items: CalendarPlacedItem[];
  dayTitle: string;
}>) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground border-border rounded-xl border border-dashed p-10 text-center text-sm">
        No hay actividades el {dayTitle}.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className={cn(
              "hover:border-primary/40 block rounded-xl border p-4 shadow-sm transition-colors",
              cardClass(item),
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {item.variant === "event" && item.source ? (
                  <span
                    className={cn(
                      "mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      item.source === "QUOTATION"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {AGENDA_SOURCE_LABEL[item.source]}
                  </span>
                ) : item.variant === "legacy" ? (
                  <span className="bg-muted text-muted-foreground mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
                    Cotización (sin evento vinculado)
                  </span>
                ) : null}
                <h3 className="text-foreground font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 font-mono text-sm tabular-nums">
                  {timeFmt.format(new Date(item.startMs))} — {timeFmt.format(new Date(item.endMs))}
                </p>
                {item.variant === "legacy" && item.legacyTotal ? (
                  <p className="text-primary mt-1 text-sm font-medium tabular-nums">
                    {priceFmt.format(Number(item.legacyTotal))}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
