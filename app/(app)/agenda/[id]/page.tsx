import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AgendaRsvp } from "@/components/agenda/agenda-rsvp";
import { DeleteEventButton } from "@/components/agenda/delete-event-button";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { AGENDA_SOURCE_LABEL, ATTENDANCE_LABEL } from "@/lib/data/agenda-labels";
import { getAgendaEventForCompany } from "@/lib/data/agenda";

const rangeFmt = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AgendaDetallePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId || !session.user?.id) {
    redirect("/dashboard");
  }
  await requirePermission(session, "agenda", "read");

  const { id } = await params;
  const detail = await getAgendaEventForCompany(id, session.activeCompanyId);
  if (!detail) {
    notFound();
  }

  const canUpdate = await sessionHasPermission(session, "agenda", "update");
  const canDelete = await sessionHasPermission(session, "agenda", "delete");

  const my = detail.attendees.find((a) => a.userId === session.user.id);
  const start = rangeFmt.format(new Date(detail.startAt));
  const end = rangeFmt.format(new Date(detail.endAt));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <PageHeader
            title={detail.title}
            description={
              detail.source === "QUOTATION"
                ? "Evento generado al aceptar la cotización. Puedes editar horarios y asistentes."
                : "Evento manual del equipo."
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                detail.source === "QUOTATION"
                  ? "bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                  : "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
              }
            >
              {AGENDA_SOURCE_LABEL[detail.source]}
            </span>
            {detail.quoteNumber && detail.quotationId ? (
              <Link
                href={`/cotizaciones/${detail.quotationId}`}
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                Ver cotización {detail.quoteNumber}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link href="/agenda">Volver</Link>
          </Button>
          {canUpdate ? (
            <Button asChild>
              <Link href={`/agenda/${detail.id}/editar`}>Editar</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="border-border bg-card/60 space-y-4 rounded-xl border p-5 shadow-sm">
          <h2 className="text-foreground text-sm font-semibold">Cuándo y dónde</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Inicio</dt>
              <dd className="capitalize">{start}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fin</dt>
              <dd className="capitalize">{end}</dd>
            </div>
            {detail.location ? (
              <div>
                <dt className="text-muted-foreground">Lugar</dt>
                <dd>{detail.location}</dd>
              </div>
            ) : null}
          </dl>
          {detail.description ? (
            <div className="border-border border-t pt-4">
              <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">Descripción</h3>
              <p className="text-foreground whitespace-pre-wrap text-sm">{detail.description}</p>
            </div>
          ) : null}

          <div className="border-border border-t pt-4">
            <p className="text-muted-foreground text-xs">
              Organiza: <span className="text-foreground">{detail.createdByName}</span>
            </p>
          </div>

          {my ? (
            <div className="border-border border-t pt-4">
              <AgendaRsvp eventId={detail.id} myStatus={my.status} />
            </div>
          ) : (
            <p className="text-muted-foreground border-border border-t pt-4 text-sm">
              No estás en la lista de asistentes de este evento.
            </p>
          )}
        </div>

        <div className="border-border bg-card/60 space-y-3 rounded-xl border p-5 shadow-sm">
          <h2 className="text-foreground text-sm font-semibold">Asistentes</h2>
          {detail.attendees.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nadie invitado aún.</p>
          ) : (
            <ul className="divide-border divide-y text-sm">
              {detail.attendees.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <div>
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{a.email}</span>
                  </div>
                  <span
                    className={
                      a.status === "PENDING"
                        ? "text-amber-600 dark:text-amber-400"
                        : a.status === "ACCEPTED"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                    }
                  >
                    {ATTENDANCE_LABEL[a.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {canDelete ? (
            <div className="border-border border-t pt-4">
              <DeleteEventButton eventId={detail.id} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
