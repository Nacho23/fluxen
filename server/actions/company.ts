"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { CompanyRole } from "@prisma/client";

import { authOptions } from "@/lib/auth/options";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "empresa";
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
});

export async function createCompany(
  _prev: unknown,
  formData: FormData,
): Promise<
  | { ok: true; companyId: string }
  | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "No autorizado" };
  }

  const hasCompanies = (session.companies?.length ?? 0) > 0;
  if (hasCompanies) {
    const role = getActiveCompanyRole(session);
    if (role !== CompanyRole.OWNER) {
      return {
        ok: false,
        error: "Solo el propietario de la empresa activa puede crear otras empresas",
      };
    }
  }

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let slug = slugify(parsed.data.name);
  const clash = await prisma.company.findUnique({ where: { slug } });
  if (clash) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const company = await prisma.company.create({
    data: {
      name: parsed.data.name,
      slug,
      members: {
        create: { userId: session.user.id, role: CompanyRole.OWNER },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, companyId: company.id };
}

const updateSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  quoteCodePrefix: z
    .string()
    .trim()
    .min(1, "Prefijo requerido")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, guión o guión bajo"),
  quoteCodePadding: z.coerce
    .number()
    .int()
    .min(3, "Mínimo 3 cifras")
    .max(10, "Máximo 10 cifras"),
});

export async function updateActiveCompany(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    return { ok: false, error: "No autorizado" };
  }

  const role = getActiveCompanyRole(session);
  if (role !== CompanyRole.OWNER) {
    return {
      ok: false,
      error: "Solo el propietario puede editar los datos de la empresa",
    };
  }

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    quoteCodePrefix: formData.get("quoteCodePrefix"),
    quoteCodePadding: formData.get("quoteCodePadding"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const companyId = session.activeCompanyId;
  let slug = slugify(parsed.data.name);
  const clash = await prisma.company.findFirst({
    where: { slug, NOT: { id: companyId } },
  });
  if (clash) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: parsed.data.name,
      slug,
      quoteCodePrefix: parsed.data.quoteCodePrefix,
      quoteCodePadding: parsed.data.quoteCodePadding,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/configuracion");
  revalidatePath("/cotizaciones");
  revalidatePath("/", "layout");
  return { ok: true };
}
