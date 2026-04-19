import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AgendaEventForm } from "@/components/agenda/event-form";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/auth/check-permission";
import { getAgendaEventForCompany } from "@/lib/data/agenda";
import { getCompanyMembersForCompany } from "@/lib/data/company-members";

export default async function EditarAgendaPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "agenda", "update");

  const { id } = await params;
  const detail = await getAgendaEventForCompany(id, session.activeCompanyId);
  if (!detail) {
    notFound();
  }

  const members = await getCompanyMembersForCompany(session.activeCompanyId);

  return (
    <div className="space-y-8">
      <PageHeader title="Editar evento" description="Cambia datos, horarios o lista de asistentes." />
      <AgendaEventForm
        members={members}
        mode="edit"
        eventId={detail.id}
        initialTitle={detail.title}
        initialDescription={detail.description ?? ""}
        initialLocation={detail.location ?? ""}
        initialStartAt={detail.startAt}
        initialEndAt={detail.endAt}
        initialAttendeeUserIds={detail.attendees.map((a) => a.userId)}
      />
    </div>
  );
}
