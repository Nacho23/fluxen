"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import {
  canDeleteFolderPolicy,
  canEditFolderMeta,
  canViewFolderPath,
} from "@/lib/documentos/access";
import { prisma } from "@/lib/db/prisma";

async function ctx() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const companyId = session?.activeCompanyId;
  if (!session || !userId || !companyId) throw new Error("No autorizado");
  const role = getActiveCompanyRole(session);
  if (!role) throw new Error("No autorizado");
  return { session, companyId, userId, role };
}

async function wouldCreateFolderCycle(
  companyId: string,
  movingFolderId: string,
  newParentId: string | null,
): Promise<boolean> {
  if (!newParentId) return false;
  if (newParentId === movingFolderId) return true;
  let cur: string | null = newParentId;
  const seen = new Set<string>();
  while (cur) {
    if (cur === movingFolderId) return true;
    if (seen.has(cur)) return true;
    seen.add(cur);
    const parentRow: { parentId: string | null } | null = await prisma.companyDocumentFolder.findFirst({
      where: { id: cur, companyId },
      select: { parentId: true },
    });
    cur = parentRow?.parentId ?? null;
  }
  return false;
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  parentId: z.union([z.string(), z.null()]).optional(),
  othersCanView: z.boolean(),
  othersCanEdit: z.boolean(),
  othersCanDelete: z.boolean(),
});

export async function createDocumentFolder(
  input: z.infer<typeof createSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { session, companyId, userId, role } = await ctx();
    const ok = await sessionHasPermission(session, "documentos", "create");
    if (!ok) return { ok: false, error: "No tienes permiso para crear carpetas" };
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    let parentId: string | null = parsed.data.parentId ?? null;

    const allFolders = await prisma.companyDocumentFolder.findMany({
      where: { companyId },
      select: {
        id: true,
        parentId: true,
        createdByUserId: true,
        othersCanView: true,
        othersCanEdit: true,
        othersCanDelete: true,
      },
    });

    if (parentId) {
      const p = await prisma.companyDocumentFolder.findFirst({
        where: { id: parentId, companyId },
      });
      if (!p) return { ok: false, error: "Carpeta padre no válida" };
      if (!canViewFolderPath({ userId, role }, parentId, allFolders)) {
        return { ok: false, error: "No puedes crear carpetas aquí" };
      }
    }

    const row = await prisma.companyDocumentFolder.create({
      data: {
        companyId,
        parentId,
        name: parsed.data.name,
        createdByUserId: userId,
        othersCanView: parsed.data.othersCanView,
        othersCanEdit: parsed.data.othersCanEdit,
        othersCanDelete: parsed.data.othersCanDelete,
      },
    });
    revalidatePath("/documentos");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear carpeta" };
  }
}

const updateFolderSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, "Nombre requerido").max(120).optional(),
    othersCanView: z.boolean().optional(),
    othersCanEdit: z.boolean().optional(),
    othersCanDelete: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.name != null ||
      d.othersCanView !== undefined ||
      d.othersCanEdit !== undefined ||
      d.othersCanDelete !== undefined,
    { message: "Nada que actualizar" },
  );

export async function updateDocumentFolder(
  input: z.infer<typeof updateFolderSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { session, companyId, userId, role } = await ctx();
    const hasMatrixUpdate = await sessionHasPermission(session, "documentos", "update");
    const parsed = updateFolderSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const row = await prisma.companyDocumentFolder.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!row) return { ok: false, error: "Carpeta no encontrada" };
    if (!canEditFolderMeta({ userId, role }, row, hasMatrixUpdate)) {
      return { ok: false, error: "No tienes permiso para editar esta carpeta" };
    }
    await prisma.companyDocumentFolder.update({
      where: { id: row.id },
      data: {
        ...(parsed.data.name != null ? { name: parsed.data.name } : {}),
        ...(parsed.data.othersCanView !== undefined ? { othersCanView: parsed.data.othersCanView } : {}),
        ...(parsed.data.othersCanEdit !== undefined ? { othersCanEdit: parsed.data.othersCanEdit } : {}),
        ...(parsed.data.othersCanDelete !== undefined ? { othersCanDelete: parsed.data.othersCanDelete } : {}),
      },
    });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function deleteDocumentFolder(
  folderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { session, companyId, userId, role } = await ctx();
    const hasMatrixDelete = await sessionHasPermission(session, "documentos", "delete");
    const row = await prisma.companyDocumentFolder.findFirst({
      where: { id: folderId, companyId },
    });
    if (!row) return { ok: false, error: "Carpeta no encontrada" };
    if (!canDeleteFolderPolicy({ userId, role }, row, hasMatrixDelete)) {
      return { ok: false, error: "No tienes permiso para eliminar esta carpeta" };
    }
    const [subCount, docCount] = await Promise.all([
      prisma.companyDocumentFolder.count({ where: { parentId: folderId, companyId } }),
      prisma.companyDocument.count({ where: { folderId, companyId } }),
    ]);
    if (subCount > 0 || docCount > 0) {
      return {
        ok: false,
        error: "La carpeta debe estar vacía (sin subcarpetas ni archivos) para eliminarla",
      };
    }
    await prisma.companyDocumentFolder.delete({ where: { id: row.id } });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al eliminar" };
  }
}

const moveSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().nullable(),
});

export async function moveDocumentFolder(
  input: z.infer<typeof moveSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { session, companyId, userId, role } = await ctx();
    const hasMatrixUpdate = await sessionHasPermission(session, "documentos", "update");
    const parsed = moveSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const row = await prisma.companyDocumentFolder.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!row) return { ok: false, error: "Carpeta no encontrada" };
    if (!canEditFolderMeta({ userId, role }, row, hasMatrixUpdate)) {
      return { ok: false, error: "No tienes permiso para mover esta carpeta" };
    }

    const allFolders = await prisma.companyDocumentFolder.findMany({
      where: { companyId },
      select: {
        id: true,
        parentId: true,
        createdByUserId: true,
        othersCanView: true,
        othersCanEdit: true,
        othersCanDelete: true,
      },
    });

    let newParentId: string | null = parsed.data.parentId;
    if (newParentId) {
      const p = await prisma.companyDocumentFolder.findFirst({
        where: { id: newParentId, companyId },
      });
      if (!p) return { ok: false, error: "Carpeta destino no válida" };
      if (!canViewFolderPath({ userId, role }, newParentId, allFolders)) {
        return { ok: false, error: "No puedes mover la carpeta aquí" };
      }
    }
    if (await wouldCreateFolderCycle(companyId, row.id, newParentId)) {
      return { ok: false, error: "No se puede mover una carpeta dentro de sí misma" };
    }
    await prisma.companyDocumentFolder.update({
      where: { id: row.id },
      data: { parentId: newParentId },
    });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al mover" };
  }
}
