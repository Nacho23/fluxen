import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CompanyRole } from "@prisma/client";

import { CompanyPermissionsForm } from "@/components/usuarios/company-permissions-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { getMergedPermissionMatrix } from "@/lib/data/company-permission-matrix";
import { getActiveCompanyRole } from "@/lib/auth/permissions";

export default async function UsuariosPermisosPage() {
  const session = await getServerSession(authOptions);
  const role = getActiveCompanyRole(session);

  if (!session?.activeCompanyId) {
    redirect("/dashboard");
  }
  if (role !== CompanyRole.OWNER) {
    redirect("/usuarios");
  }

  const matrix = await getMergedPermissionMatrix(session.activeCompanyId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Permisos por rol"
          description="Controla acceso a cada módulo: ver listados, crear registros, editar y eliminar. El propietario no aparece aquí porque siempre tiene todos los permisos."
        />
        <Button variant="outline" asChild className="w-fit shrink-0">
          <Link href="/usuarios">Volver a usuarios</Link>
        </Button>
      </div>

      <CompanyPermissionsForm
        initial={{
          ADMIN: matrix.ADMIN,
          OPS_ADMIN: matrix.OPS_ADMIN,
          FIELD: matrix.FIELD,
        }}
      />
    </div>
  );
}
