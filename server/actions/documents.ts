"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import {
  canDeleteDocument,
  canEditDocumentMeta,
  canViewDocument,
  canViewFolderPath,
} from "@/lib/documentos/access";
import { deleteObject, isR2Configured, presignGetObject } from "@/lib/storage/r2";
import { prisma } from "@/lib/db/prisma";

async function getSessionContext() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const companyId = session?.activeCompanyId;
  if (!session || !userId || !companyId) {
    throw new Error("No autorizado");
  }
  const role = getActiveCompanyRole(session);
  if (!role) {
    throw new Error("No autorizado");
  }
  return { session, userId, companyId, role };
}

export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    if (!isR2Configured()) {
      return { ok: false, error: "Almacenamiento no configurado" };
    }
    const { session, userId, companyId, role } = await getSessionContext();
    const canRead = await sessionHasPermission(session, "documentos", "read");
    if (!canRead) {
      return { ok: false, error: "No autorizado" };
    }
    const doc = await prisma.companyDocument.findFirst({
      where: { id: documentId, companyId },
    });
    if (!doc) {
      return { ok: false, error: "Documento no encontrado" };
    }
    if (
      !canViewDocument(
        { userId, role },
        {
          uploadedByUserId: doc.uploadedByUserId,
          othersCanView: doc.othersCanView,
          othersCanEdit: doc.othersCanEdit,
          othersCanDelete: doc.othersCanDelete,
        },
      )
    ) {
      return { ok: false, error: "No puedes descargar este documento" };
    }
    if (doc.folderId) {
      const chain = await prisma.companyDocumentFolder.findMany({
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
      if (!canViewFolderPath({ userId, role }, doc.folderId, chain)) {
        return { ok: false, error: "No puedes descargar este documento" };
      }
    }
    const displayName = doc.title?.trim() || doc.originalFilename;
    const url = await presignGetObject(doc.storageKey, displayName);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al generar el enlace" };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(200).optional().nullable(),
  othersCanView: z.boolean(),
  othersCanEdit: z.boolean(),
  othersCanDelete: z.boolean(),
  /** null = raíz del explorador */
  folderId: z.string().nullable().optional(),
});

export async function updateCompanyDocument(
  input: z.infer<typeof updateSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { session, userId, companyId, role } = await getSessionContext();
    const hasMatrixUpdate = await sessionHasPermission(session, "documentos", "update");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const doc = await prisma.companyDocument.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!doc) {
      return { ok: false, error: "Documento no encontrado" };
    }
    const policy = {
      uploadedByUserId: doc.uploadedByUserId,
      othersCanView: doc.othersCanView,
      othersCanEdit: doc.othersCanEdit,
      othersCanDelete: doc.othersCanDelete,
    };
    if (!canEditDocumentMeta({ userId, role }, policy, hasMatrixUpdate)) {
      return { ok: false, error: "No tienes permiso para editar este documento" };
    }
    const title =
      parsed.data.title != null && String(parsed.data.title).trim() !== ""
        ? String(parsed.data.title).trim()
        : null;

    let nextFolderId: string | null | undefined = undefined;
    if (parsed.data.folderId !== undefined) {
      if (parsed.data.folderId === null) {
        nextFolderId = null;
      } else {
        const f = await prisma.companyDocumentFolder.findFirst({
          where: { id: parsed.data.folderId, companyId },
        });
        if (!f) {
          return { ok: false, error: "Carpeta no válida" };
        }
        const chain = await prisma.companyDocumentFolder.findMany({
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
        if (!canViewFolderPath({ userId, role }, f.id, chain)) {
          return { ok: false, error: "No puedes mover el archivo a esa carpeta" };
        }
        nextFolderId = f.id;
      }
    }

    await prisma.companyDocument.update({
      where: { id: doc.id },
      data: {
        title,
        othersCanView: parsed.data.othersCanView,
        othersCanEdit: parsed.data.othersCanEdit,
        othersCanDelete: parsed.data.othersCanDelete,
        ...(nextFolderId !== undefined ? { folderId: nextFolderId } : {}),
      },
    });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function deleteCompanyDocument(
  documentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!isR2Configured()) {
      return { ok: false, error: "Almacenamiento no configurado" };
    }
    const { session, userId, companyId, role } = await getSessionContext();
    const hasMatrixDelete = await sessionHasPermission(session, "documentos", "delete");
    const doc = await prisma.companyDocument.findFirst({
      where: { id: documentId, companyId },
    });
    if (!doc) {
      return { ok: false, error: "Documento no encontrado" };
    }
    const policy = {
      uploadedByUserId: doc.uploadedByUserId,
      othersCanView: doc.othersCanView,
      othersCanEdit: doc.othersCanEdit,
      othersCanDelete: doc.othersCanDelete,
    };
    if (!canDeleteDocument({ userId, role }, policy, hasMatrixDelete)) {
      return { ok: false, error: "No tienes permiso para eliminar este documento" };
    }
    await deleteObject(doc.storageKey);
    await prisma.companyDocument.delete({ where: { id: doc.id } });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al eliminar" };
  }
}
