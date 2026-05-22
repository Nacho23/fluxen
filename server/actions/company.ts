"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { CompanyRole } from "@/lib/prisma/enums-public";

import { authOptions } from "@/lib/auth/options";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  assertBrandingKeyBelongsToCompany,
  deleteObject,
} from "@/lib/storage/r2";

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
  revalidatePath("/configuracion/ficha");
  revalidatePath("/configuracion/preferencias");
  revalidatePath("/", "layout");
  return { ok: true, companyId: company.id };
}

function formText(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

const optionalCompanyEmail = z
  .string()
  .trim()
  .max(254)
  .transform((s) => (s === "" ? null : s.toLowerCase()))
  .refine((s) => s === null || z.string().email().safeParse(s).success, {
    message: "Correo no válido",
  });

const optionalWebsite = z
  .string()
  .trim()
  .max(500)
  .transform((s) => (s === "" ? null : s))
  .refine((s) => s === null || z.string().url().safeParse(s).success, {
    message: "URL no válida (usa http:// o https://)",
  });

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
  workOrderCodePrefix: z
    .string()
    .trim()
    .min(1, "Prefijo de orden requerido")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, guión o guión bajo"),
  workOrderCodePadding: z.coerce
    .number()
    .int()
    .min(3, "Mínimo 3 cifras")
    .max(10, "Máximo 10 cifras"),
  address: z.string().trim().max(5000).transform((s) => (s === "" ? null : s)),
  phone: z.string().trim().max(50).transform((s) => (s === "" ? null : s)),
  legalRepresentative: z.string().trim().max(200).transform((s) => (s === "" ? null : s)),
  companyEmail: optionalCompanyEmail,
  website: optionalWebsite,
  city: z.string().trim().max(120).transform((s) => (s === "" ? null : s)),
  country: z.string().trim().max(100).transform((s) => (s === "" ? null : s)),
  rut: z.string().trim().max(20).transform((s) => (s === "" ? null : s)),
  businessName: z.string().trim().max(200).transform((s) => (s === "" ? null : s)),
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
    name: formText(formData, "name"),
    quoteCodePrefix: formText(formData, "quoteCodePrefix"),
    quoteCodePadding: formText(formData, "quoteCodePadding"),
    workOrderCodePrefix: formText(formData, "workOrderCodePrefix"),
    workOrderCodePadding: formText(formData, "workOrderCodePadding"),
    address: formText(formData, "address"),
    phone: formText(formData, "phone"),
    legalRepresentative: formText(formData, "legalRepresentative"),
    companyEmail: formText(formData, "companyEmail"),
    website: formText(formData, "website"),
    city: formText(formData, "city"),
    country: formText(formData, "country"),
    rut: formText(formData, "rut"),
    businessName: formText(formData, "businessName"),
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
      workOrderCodePrefix: parsed.data.workOrderCodePrefix,
      workOrderCodePadding: parsed.data.workOrderCodePadding,
      address: parsed.data.address,
      phone: parsed.data.phone,
      legalRepresentative: parsed.data.legalRepresentative,
      email: parsed.data.companyEmail,
      website: parsed.data.website,
      city: parsed.data.city,
      country: parsed.data.country,
      rut: parsed.data.rut,
      businessName: parsed.data.businessName,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/configuracion");
  revalidatePath("/configuracion/ficha");
  revalidatePath("/configuracion/preferencias");
  revalidatePath("/cotizaciones");
  revalidatePath("/ordenes");
  revalidatePath("/", "layout");
  return { ok: true };
}

const optionalHttpsImageUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((s) => (s === "" ? null : s))
  .refine((s) => s === null || z.string().url().safeParse(s).success, {
    message: "URL no válida (usa http:// o https://)",
  })
  .refine((s) => s === null || /^https?:\/\//i.test(s), {
    message: "Solo se permiten URLs http o https",
  });

const sidebarSettingsSchema = z.object({
  sidebarPanelStyle: z.enum(["STANDARD", "BRANDED"]),
  sidebarCoverUrl: optionalHttpsImageUrl,
  sidebarAvatarUrl: optionalHttpsImageUrl,
});

function checkboxOn(formData: FormData, name: string): boolean {
  const v = formData.get(name);
  return v === "on" || v === "true";
}

export async function updateCompanySidebarSettings(
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
      error: "Solo el propietario puede cambiar la apariencia del menú",
    };
  }

  const companyId = session.activeCompanyId;
  const current = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      sidebarCoverUrl: true,
      sidebarCoverStorageKey: true,
      sidebarAvatarUrl: true,
      sidebarAvatarStorageKey: true,
    },
  });
  if (!current) {
    return { ok: false, error: "Empresa no encontrada" };
  }

  const removeCover = checkboxOn(formData, "removeSidebarCover");
  const removeAvatar = checkboxOn(formData, "removeSidebarAvatar");

  const styleRaw = formData.get("sidebarPanelStyle");
  const parsed = sidebarSettingsSchema.safeParse({
    sidebarPanelStyle: typeof styleRaw === "string" ? styleRaw : "",
    sidebarCoverUrl: formText(formData, "sidebarCoverUrl"),
    sidebarAvatarUrl: formText(formData, "sidebarAvatarUrl"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let nextCoverUrl = current.sidebarCoverUrl;
  let nextCoverKey = current.sidebarCoverStorageKey;
  let nextAvatarUrl = current.sidebarAvatarUrl;
  let nextAvatarKey = current.sidebarAvatarStorageKey;

  if (removeCover) {
    nextCoverUrl = null;
    if (nextCoverKey) {
      try {
        assertBrandingKeyBelongsToCompany(nextCoverKey, companyId);
        await deleteObject(nextCoverKey);
      } catch {
        /* ignore */
      }
      nextCoverKey = null;
    }
  } else {
    const submittedCover = parsed.data.sidebarCoverUrl;
    if (submittedCover) {
      nextCoverUrl = submittedCover;
      if (nextCoverKey) {
        try {
          assertBrandingKeyBelongsToCompany(nextCoverKey, companyId);
          await deleteObject(nextCoverKey);
        } catch {
          /* ignore */
        }
        nextCoverKey = null;
      }
    } else {
      nextCoverUrl = null;
      nextCoverKey = current.sidebarCoverStorageKey;
    }
  }

  if (removeAvatar) {
    nextAvatarUrl = null;
    if (nextAvatarKey) {
      try {
        assertBrandingKeyBelongsToCompany(nextAvatarKey, companyId);
        await deleteObject(nextAvatarKey);
      } catch {
        /* ignore */
      }
      nextAvatarKey = null;
    }
  } else {
    const submittedAvatar = parsed.data.sidebarAvatarUrl;
    if (submittedAvatar) {
      nextAvatarUrl = submittedAvatar;
      if (nextAvatarKey) {
        try {
          assertBrandingKeyBelongsToCompany(nextAvatarKey, companyId);
          await deleteObject(nextAvatarKey);
        } catch {
          /* ignore */
        }
        nextAvatarKey = null;
      }
    } else {
      nextAvatarUrl = null;
      nextAvatarKey = current.sidebarAvatarStorageKey;
    }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      sidebarPanelStyle: parsed.data.sidebarPanelStyle,
      sidebarCoverUrl: nextCoverUrl,
      sidebarAvatarUrl: nextAvatarUrl,
      sidebarCoverStorageKey: nextCoverKey,
      sidebarAvatarStorageKey: nextAvatarKey,
    },
  });

  revalidatePath("/configuracion");
  revalidatePath("/configuracion/ficha");
  revalidatePath("/configuracion/preferencias");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCompanyLogo(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    return { ok: false, error: "No autorizado" };
  }
  const role = getActiveCompanyRole(session);
  if (role !== CompanyRole.OWNER) {
    return { ok: false, error: "Solo el propietario puede cambiar el logo" };
  }

  const companyId = session.activeCompanyId;
  const current = await prisma.company.findUnique({
    where: { id: companyId },
    select: { logoStorageKey: true },
  });
  if (!current) return { ok: false, error: "Empresa no encontrada" };

  if (current.logoStorageKey) {
    try {
      assertBrandingKeyBelongsToCompany(current.logoStorageKey, companyId);
      await deleteObject(current.logoStorageKey);
    } catch {
      /* ignore */
    }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { logoStorageKey: null, logoUrl: null },
  });

  revalidatePath("/configuracion");
  revalidatePath("/configuracion/ficha");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true };
}
