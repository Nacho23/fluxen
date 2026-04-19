/** Utilidades de calendario (zona horaria local del servidor / mismo criterio en cliente al enlazar fechas). */

export const WEEKDAY_LABELS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export function formatDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKeyLocal(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** Fin exclusivo del día (00:00 del día siguiente). */
export function endOfDayExclusiveLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

export function addDaysLocal(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export type MonthGridCell = {
  date: Date;
  key: string;
  inMonth: boolean;
};

/**
 * Semana que empieza en lunes. Cubre todas las semanas que tocan el mes.
 */
export function getMonthGridCells(year: number, monthIndex: number): {
  cells: MonthGridCell[];
  gridStart: Date;
  gridEndExclusive: Date;
} {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = startOfDayLocal(addDaysLocal(firstOfMonth, -mondayOffset));

  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const dowLast = (lastOfMonth.getDay() + 6) % 7;
  const daysToSunday = 6 - dowLast;
  const lastSunday = addDaysLocal(lastOfMonth, daysToSunday);
  const gridEndExclusive = addDaysLocal(startOfDayLocal(lastSunday), 1);

  const cells: MonthGridCell[] = [];
  for (let cur = new Date(gridStart); cur < gridEndExclusive; cur = addDaysLocal(cur, 1)) {
    const day = startOfDayLocal(cur);
    cells.push({
      date: day,
      key: formatDateKeyLocal(day),
      inMonth: day.getMonth() === monthIndex,
    });
  }

  return { cells, gridStart, gridEndExclusive };
}

export function todayDateKeyLocal(): string {
  return formatDateKeyLocal(new Date());
}
