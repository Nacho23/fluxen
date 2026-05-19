import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AgendaCalendarNav } from "@/components/agenda/agenda-calendar-nav";
import { AgendaDayView } from "@/components/agenda/agenda-day-view";
import type { DayPlacementSerialized, MonthGridCellSerialized } from "@/components/agenda/agenda-month-grid";
import { AgendaMonthGrid } from "@/components/agenda/agenda-month-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  endOfDayExclusiveLocal,
  formatDateKeyLocal,
  getMonthGridCells,
  parseDateKeyLocal,
  startOfDayLocal,
} from "@/lib/agenda/calendar-utils";
import { itemsForSingleDay, placeItemsOnMonthGrid } from "@/lib/agenda/calendar-placement";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getMergedAgendaRows } from "@/lib/data/agenda";

const monthLabelFmt = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
const dayLongFmt = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function AgendaPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ año?: string; mes?: string; fecha?: string }>;
}>) {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "agenda", "read");

  const sp = await searchParams;
  const now = new Date();
  const y = sp.año != null && sp.año !== "" ? Number(sp.año) : now.getFullYear();
  const m = sp.mes != null && sp.mes !== "" ? Number(sp.mes) - 1 : now.getMonth();
  const year = Number.isFinite(y) ? y : now.getFullYear();
  const monthIndex = Number.isFinite(m) && m >= 0 && m <= 11 ? m : now.getMonth();

  const fechaRaw = sp.fecha?.trim();
  const fechaParsed = fechaRaw ? parseDateKeyLocal(fechaRaw) : null;
  const isDayView = Boolean(fechaParsed);

  const canCreate = await sessionHasPermission(session, "agenda", "create");

  if (isDayView && fechaParsed) {
    const dayKey = formatDateKeyLocal(fechaParsed);
    const from = startOfDayLocal(fechaParsed);
    const to = endOfDayExclusiveLocal(fechaParsed);
    const rows = await getMergedAgendaRows(session.activeCompanyId, from, to);
    const items = itemsForSingleDay(rows, dayKey);
    const dayTitle = dayLongFmt.format(fechaParsed);

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Agenda"
            description="Vista por día: actividades ordenadas por hora. Cambia a «Mes» para ver el calendario completo."
          />
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button asChild className="shrink-0 gap-2">
                <Link href="/agenda/nueva">Nuevo evento</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <AgendaCalendarNav
          mode="dia"
          year={fechaParsed.getFullYear()}
          monthIndex={fechaParsed.getMonth()}
          fechaKey={dayKey}
          monthLabel={monthLabelFmt.format(new Date(year, monthIndex, 1))}
          dayLongLabel={dayTitle}
        />

        <AgendaDayView items={items} dayTitle={dayTitle} />
      </div>
    );
  }

  const { cells, gridStart, gridEndExclusive } = getMonthGridCells(year, monthIndex);
  const rows = await getMergedAgendaRows(session.activeCompanyId, gridStart, gridEndExclusive);
  const placementMap = placeItemsOnMonthGrid(
    rows,
    cells.map((c) => c.key),
  );

  const placement: Record<string, DayPlacementSerialized> = {};
  for (const [k, v] of placementMap) {
    placement[k] = { visible: v.visible, overflow: v.overflow };
  }

  const cellsSerialized: MonthGridCellSerialized[] = cells.map((c) => ({
    key: c.key,
    dayNumber: c.date.getDate(),
    inMonth: c.inMonth,
  }));

  const monthLabel = monthLabelFmt.format(new Date(year, monthIndex, 1));
  const todayKey = formatDateKeyLocal(now);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Agenda"
          description="Vista mensual tipo calendario: cada evento aparece en el día que corresponde (incluidos los que abarcan varios días). Usa «Día» para listar solo una fecha en orden horario."
        />
        {canCreate ? (
          <Button asChild className="shrink-0 gap-2">
            <Link href="/agenda/nueva">Nuevo evento</Link>
          </Button>
        ) : null}
      </div>

      <AgendaCalendarNav
        mode="mes"
        year={year}
        monthIndex={monthIndex}
        monthLabel={monthLabel}
      />

      <AgendaMonthGrid cells={cellsSerialized} placement={placement} todayKey={todayKey} />
    </div>
  );
}
