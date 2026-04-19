import type { AgendaEventSource } from "@/lib/prisma/enums-public";

import type { AgendaMergedRow } from "@/lib/data/agenda";

import { endOfDayExclusiveLocal, parseDateKeyLocal, startOfDayLocal } from "./calendar-utils";

export type CalendarPlacedItem = {
  id: string;
  title: string;
  href: string;
  startMs: number;
  endMs: number;
  variant: "event" | "legacy";
  source?: AgendaEventSource;
  /** Solo cotización legacy */
  legacyTotal?: string;
};

const MAX_CHIPS_PER_CELL = 3;

function mergedRowToItem(row: AgendaMergedRow): CalendarPlacedItem {
  if (row.kind === "event") {
    const e = row.event;
    return {
      id: e.id,
      title: e.title,
      href: `/agenda/${e.id}`,
      startMs: new Date(e.startAt).getTime(),
      endMs: new Date(e.endAt).getTime(),
      variant: "event",
      source: e.source,
    };
  }
  const start = new Date(row.serviceDate);
  const s = startOfDayLocal(start);
  const end = endOfDayExclusiveLocal(start);
  return {
    id: `legacy-${row.id}`,
    title: `${row.quoteNumber} · ${row.clientName}`,
    href: `/cotizaciones/${row.id}`,
    startMs: s.getTime(),
    endMs: end.getTime(),
    variant: "legacy",
    legacyTotal: row.total,
  };
}

function intersectsDay(item: CalendarPlacedItem, dayStart: Date, dayEndExclusive: Date): boolean {
  return item.startMs < dayEndExclusive.getTime() && item.endMs > dayStart.getTime();
}

export type DayCellContent = {
  key: string;
  items: CalendarPlacedItem[];
  visible: CalendarPlacedItem[];
  overflow: number;
};

/**
 * Coloca ítems en cada día del calendario (eventos multi-día aparecen en cada día que tocan).
 */
export function placeItemsOnMonthGrid(
  rows: AgendaMergedRow[],
  dayKeys: string[],
): Map<string, DayCellContent> {
  const items = rows.map(mergedRowToItem);
  const map = new Map<string, DayCellContent>();

  for (const key of dayKeys) {
    const parsed = parseDateKeyLocal(key);
    if (!parsed) continue;
    const dayStart = startOfDayLocal(parsed);
    const dayEndEx = endOfDayExclusiveLocal(parsed);

    const dayItems = items
      .filter((it) => intersectsDay(it, dayStart, dayEndEx))
      .sort((a, b) => a.startMs - b.startMs);

    const visible = dayItems.slice(0, MAX_CHIPS_PER_CELL);
    const overflow = Math.max(0, dayItems.length - MAX_CHIPS_PER_CELL);

    map.set(key, {
      key,
      items: dayItems,
      visible,
      overflow,
    });
  }

  return map;
}

/** Para vista día: filas ordenadas cronológicamente. */
export function itemsForSingleDay(rows: AgendaMergedRow[], dayKey: string): CalendarPlacedItem[] {
  const parsed = parseDateKeyLocal(dayKey);
  if (!parsed) return [];
  const dayStart = startOfDayLocal(parsed);
  const dayEndEx = endOfDayExclusiveLocal(parsed);
  const items = rows.map(mergedRowToItem).filter((it) => intersectsDay(it, dayStart, dayEndEx));
  items.sort((a, b) => a.startMs - b.startMs);
  return items;
}
