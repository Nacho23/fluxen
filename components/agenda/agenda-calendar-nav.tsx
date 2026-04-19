import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AgendaViewModeTabs } from "@/components/agenda/agenda-view-mode-tabs";
import {
  addDaysLocal,
  formatDateKeyLocal,
  parseDateKeyLocal,
  todayDateKeyLocal,
} from "@/lib/agenda/calendar-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  mode: "mes" | "dia";
  year: number;
  monthIndex: number;
  /** Vista día: YYYY-MM-DD */
  fechaKey?: string;
  monthLabel: string;
  dayLongLabel?: string;
}>;

function monthQuery(y: number, m: number): string {
  return `?año=${y}&mes=${m + 1}`;
}

export function AgendaCalendarNav({
  mode,
  year,
  monthIndex,
  fechaKey,
  monthLabel,
  dayLongLabel,
}: Props) {
  const todayKey = todayDateKeyLocal();

  const monthHrefDefault = `/agenda${monthQuery(year, monthIndex)}`;
  const dayHrefDefault = `/agenda?fecha=${todayKey}`;

  let monthHrefForTab = monthHrefDefault;
  let dayHrefForTab = dayHrefDefault;

  if (mode === "dia" && fechaKey) {
    const parsed = parseDateKeyLocal(fechaKey);
    if (parsed) {
      monthHrefForTab = `/agenda${monthQuery(parsed.getFullYear(), parsed.getMonth())}`;
    }
  }

  if (mode === "mes") {
    dayHrefForTab = `/agenda?fecha=${todayKey}`;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <AgendaViewModeTabs mode={mode} monthHref={monthHrefForTab} dayHref={dayHrefForTab} />
        {mode === "mes" ? (
          <h2 className="text-foreground text-lg font-semibold tracking-tight capitalize">{monthLabel}</h2>
        ) : (
          <h2 className="text-foreground text-lg font-semibold tracking-tight capitalize">{dayLongLabel}</h2>
        )}
      </div>

      {mode === "mes" ? (
        <MonthNavArrows year={year} monthIndex={monthIndex} />
      ) : fechaKey ? (
        <DayNavArrows fechaKey={fechaKey} />
      ) : null}
    </div>
  );
}

function MonthNavArrows({ year, monthIndex }: Readonly<{ year: number; monthIndex: number }>) {
  const prev = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const prevY = prev.getFullYear();
  const prevM = prev.getMonth();
  const nextY = next.getFullYear();
  const nextM = next.getMonth();

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="size-9" asChild>
        <Link href={`/agenda${monthQuery(prevY, prevM)}`} aria-label="Mes anterior">
          <ChevronLeft className="size-4" />
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/agenda" className={cn("min-w-[5rem]")}>
          Este mes
        </Link>
      </Button>
      <Button variant="outline" size="icon" className="size-9" asChild>
        <Link href={`/agenda${monthQuery(nextY, nextM)}`} aria-label="Mes siguiente">
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function DayNavArrows({ fechaKey }: Readonly<{ fechaKey: string }>) {
  const parsed = parseDateKeyLocal(fechaKey);
  if (!parsed) return null;

  const prev = addDaysLocal(parsed, -1);
  const next = addDaysLocal(parsed, 1);
  const prevKey = formatDateKeyLocal(prev);
  const nextKey = formatDateKeyLocal(next);
  const monthOfDay = `/agenda${monthQuery(parsed.getFullYear(), parsed.getMonth())}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-9" asChild>
          <Link href={`/agenda?fecha=${prevKey}`} aria-label="Día anterior">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/agenda?fecha=${todayDateKeyLocal()}`}>Hoy</Link>
        </Button>
        <Button variant="outline" size="icon" className="size-9" asChild>
          <Link href={`/agenda?fecha=${nextKey}`} aria-label="Día siguiente">
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
      <Button variant="secondary" size="sm" asChild>
        <Link href={monthOfDay}>Ver mes</Link>
      </Button>
    </div>
  );
}
