import { getServerSession } from "next-auth";
import { CompanyRole } from "@/lib/prisma/enums-public";
import { redirect } from "next/navigation";

import { CompanyMembersPanel } from "@/components/usuarios/company-members-panel";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { COMPANY_ROLE_LABEL, getActiveCompanyRole } from "@/lib/auth/permissions";
import { getCompanyMembersForCompany } from "@/lib/data/company-members";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  const role = getActiveCompanyRole(session);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  await requirePermission(session, "usuarios", "read");

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    sessionHasPermission(session, "usuarios", "create"),
    sessionHasPermission(session, "usuarios", "update"),
    sessionHasPermission(session, "usuarios", "delete"),
  ]);

  const members = await getCompanyMembersForCompany(session.activeCompanyId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <PageHeader
          title="Usuarios de la empresa"
          description={
            role === CompanyRole.OWNER
              ? "Invita a tu equipo y define permisos con el rol de cada persona. Como propietario puedes asignar y editar cualquier rol (incluidos otros propietarios y administradores) desde la tabla."
              : "Invita a tu equipo y asigna roles. Los administradores no pueden crear propietarios ni otros administradores."
          }
        />
        {role === CompanyRole.OWNER ? (
          <a
            href="/usuarios/permisos"
            className="text-muted-foreground hover:text-foreground shrink-0 text-sm underline-offset-4 transition-colors hover:underline"
          >
            Permisos por rol
          </a>
        ) : null}
      </div>
      <CompanyMembersPanel
        members={members}
        currentUserId={session.user.id}
        actorRole={role!}
        roleLabels={COMPANY_ROLE_LABEL}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
