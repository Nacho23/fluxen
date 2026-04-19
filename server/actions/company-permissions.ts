"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { CompanyRole } from "@/lib/prisma/enums-public";

import { authOptions } from "@/lib/auth/options";
import { savePayloadSchema } from "@/lib/auth/company-permissions";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export async function updateCompanyRolePermissions(
  payload: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.activeCompanyId) {
      return { ok: false, error: "No autorizado" };
    }
    if (getActiveCompanyRole(session) !== CompanyRole.OWNER) {
      return { ok: false, error: "Solo el propietario puede editar permisos" };
    }

    const parsed = savePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Datos de permisos no válidos" };
    }

    await prisma.company.update({
      where: { id: session.activeCompanyId },
      data: {
        rolePermissions: parsed.data as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/usuarios");
    revalidatePath("/usuarios/permisos");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar permisos";
    return { ok: false, error: msg };
  }
}
