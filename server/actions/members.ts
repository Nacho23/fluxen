"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { CompanyRole, Prisma } from "@prisma/client";
import { z } from "zod";

import { defaultPasswordFromEmail } from "@/lib/auth/default-password";
import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { parseInviteProfileExtras, parseProfileFormData } from "@/lib/user-profile/parse-profile-form-data";

async function requireUsuariosAction(
  action: "read" | "create" | "update" | "delete",
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const allowed = await sessionHasPermission(session, "usuarios", action);
  if (!allowed) {
    throw new Error("No tienes permiso para esta acción");
  }
  const role = getActiveCompanyRole(session);
  if (!role) {
    throw new Error("No autorizado");
  }
  return { session, companyId: session.activeCompanyId, actorRole: role };
}

function assertAssignableRole(actor: CompanyRole, target: CompanyRole) {
  if (actor === CompanyRole.OWNER) return;
  if (
    actor === CompanyRole.ADMIN ||
    actor === CompanyRole.OPS_ADMIN ||
    actor === CompanyRole.FIELD
  ) {
    if (target === CompanyRole.OWNER || target === CompanyRole.ADMIN) {
      throw new Error(
        "Solo el propietario puede asignar el rol de propietario o administrador",
      );
    }
    return;
  }
  throw new Error("Sin permiso");
}

function assertActorCanModifyMember(actor: CompanyRole, memberRole: CompanyRole) {
  if (actor === CompanyRole.OWNER) return;
  if (
    actor === CompanyRole.ADMIN ||
    actor === CompanyRole.OPS_ADMIN ||
    actor === CompanyRole.FIELD
  ) {
    if (memberRole === CompanyRole.OWNER || memberRole === CompanyRole.ADMIN) {
      throw new Error(
        "Solo el propietario puede modificar a otros propietarios o administradores",
      );
    }
  }
}

const addSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(["OWNER", "ADMIN", "OPS_ADMIN", "FIELD"]),
});

export async function addCompanyMember(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, actorRole } = await requireUsuariosAction("create");

    const parsed = addSchema.safeParse({
      email: formData.get("email"),
      role: formData.get("role"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Correo o rol no válidos" };
    }

    const targetRole = parsed.data.role as CompanyRole;
    assertAssignableRole(actorRole, targetRole);

    const email = parsed.data.email;

    const extras = parseInviteProfileExtras(formData);
    if (!extras.ok) {
      return { ok: false, error: extras.error };
    }
    const ex = extras.data;
    const nameForNew =
      ex.name.trim() || email.split("@")[0] || "Usuario";

    await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        const hash = await bcrypt.hash(defaultPasswordFromEmail(email), 10);
        try {
          user = await tx.user.create({
            data: {
              email,
              password: hash,
              name: nameForNew,
              rut: ex.rut,
              phone: ex.phone,
              address: ex.address,
              bankName: ex.bankName,
              bankAccountType: ex.bankAccountType,
              bankAccountNumber: ex.bankAccountNumber,
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2002"
          ) {
            user = await tx.user.findUnique({ where: { email } });
          } else {
            throw e;
          }
        }
      }
      if (!user) {
        throw new Error("No se pudo crear ni encontrar el usuario");
      }

      const exists = await tx.companyMember.findUnique({
        where: { userId_companyId: { userId: user.id, companyId } },
      });
      if (exists) {
        throw new Error("Ese usuario ya pertenece a esta empresa");
      }

      await tx.companyMember.create({
        data: {
          userId: user.id,
          companyId,
          role: targetRole,
        },
      });
    });

    // TODO: enviar correo de invitación con enlace o credenciales cuando haya proveedor SMTP.

    revalidatePath("/usuarios");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al añadir";
    return { ok: false, error: msg };
  }
}

const updateSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "OPS_ADMIN", "FIELD"]),
});

export async function updateCompanyMemberRole(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, actorRole, session } = await requireUsuariosAction("update");

    const parsed = updateSchema.safeParse({
      memberId: formData.get("memberId"),
      role: formData.get("role"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Datos no válidos" };
    }

    const targetRole = parsed.data.role as CompanyRole;
    assertAssignableRole(actorRole, targetRole);

    const member = await prisma.companyMember.findFirst({
      where: { id: parsed.data.memberId, companyId },
    });
    if (!member) {
      return { ok: false, error: "Miembro no encontrado" };
    }

    assertActorCanModifyMember(actorRole, member.role);

    if (member.userId === session.user!.id && member.role === CompanyRole.OWNER) {
      const otherOwners = await prisma.companyMember.count({
        where: {
          companyId,
          role: CompanyRole.OWNER,
          userId: { not: session.user!.id },
        },
      });
      if (otherOwners === 0 && targetRole !== CompanyRole.OWNER) {
        return {
          ok: false,
          error: "Debe haber al menos otro propietario antes de cambiar tu rol",
        };
      }
    }

    if (member.role === CompanyRole.OWNER && targetRole !== CompanyRole.OWNER) {
      const owners = await prisma.companyMember.count({
        where: { companyId, role: CompanyRole.OWNER },
      });
      if (owners <= 1) {
        return {
          ok: false,
          error: "La empresa debe tener al menos un propietario",
        };
      }
    }

    await prisma.companyMember.update({
      where: { id: member.id },
      data: { role: targetRole },
    });

    revalidatePath("/usuarios");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return { ok: false, error: msg };
  }
}

const updateMemberProfileSchema = z.object({
  memberId: z.string().min(1),
});

export async function updateMemberUserProfile(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, actorRole, session } = await requireUsuariosAction("update");

    const idParsed = updateMemberProfileSchema.safeParse({
      memberId: formData.get("memberId"),
    });
    if (!idParsed.success) {
      return { ok: false, error: "Datos no válidos" };
    }

    const member = await prisma.companyMember.findFirst({
      where: { id: idParsed.data.memberId, companyId },
    });
    if (!member) {
      return { ok: false, error: "Miembro no encontrado" };
    }

    assertActorCanModifyMember(actorRole, member.role);

    const parsed = parseProfileFormData(formData);
    if (!parsed.ok) {
      return parsed;
    }

    await prisma.user.update({
      where: { id: member.userId },
      data: {
        name: parsed.data.name,
        rut: parsed.data.rut,
        phone: parsed.data.phone,
        address: parsed.data.address,
        bankName: parsed.data.bankName,
        bankAccountType: parsed.data.bankAccountType,
        bankAccountNumber: parsed.data.bankAccountNumber,
      },
    });

    if (member.userId === session.user!.id) {
      revalidatePath("/perfil");
    }
    revalidatePath("/usuarios");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar datos";
    return { ok: false, error: msg };
  }
}

export async function removeCompanyMember(
  memberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId, session, actorRole } = await requireUsuariosAction("delete");

    const member = await prisma.companyMember.findFirst({
      where: { id: memberId, companyId },
    });
    if (!member) {
      return { ok: false, error: "Miembro no encontrado" };
    }

    assertActorCanModifyMember(actorRole, member.role);

    if (member.userId === session.user!.id) {
      return { ok: false, error: "No puedes eliminarte a ti mismo desde aquí" };
    }

    if (member.role === CompanyRole.OWNER) {
      const owners = await prisma.companyMember.count({
        where: { companyId, role: CompanyRole.OWNER },
      });
      if (owners <= 1) {
        return { ok: false, error: "No puedes quitar al único propietario" };
      }
    }

    await prisma.companyMember.delete({ where: { id: member.id } });

    revalidatePath("/usuarios");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return { ok: false, error: msg };
  }
}
