import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { canViewFolderPath } from "@/lib/documentos/access";
import { isAllowedDocumentUpload } from "@/lib/documentos/mime";
import { prisma } from "@/lib/db/prisma";
import {
  buildObjectKey,
  deleteObject,
  isR2Configured,
  MAX_UPLOAD_BYTES,
  putObjectBytes,
  sanitizeFilename,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { ok: false, error: "Almacenamiento no configurado" },
        { status: 503 },
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const companyId = session?.activeCompanyId;
    if (!session || !userId || !companyId) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const role = getActiveCompanyRole(session);
    if (!role) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const canCreate = await sessionHasPermission(session, "documentos", "create");
    if (!canCreate) {
      return NextResponse.json({ ok: false, error: "No tienes permiso para subir documentos" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size < 1) {
      return NextResponse.json({ ok: false, error: "Selecciona un archivo" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: `El archivo supera el máximo de ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB` },
        { status: 400 },
      );
    }

    const contentType = file.type.trim() || "application/octet-stream";
    if (!isAllowedDocumentUpload(file.name, contentType)) {
      return NextResponse.json({ ok: false, error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    const titleRaw = formData.get("title");
    const title =
      typeof titleRaw === "string" && titleRaw.trim() !== "" ? titleRaw.trim().slice(0, 200) : null;

    const othersCanView = formData.get("othersCanView") === "true";
    const othersCanEdit = formData.get("othersCanEdit") === "true";
    const othersCanDelete = formData.get("othersCanDelete") === "true";

    const folderIdRaw = formData.get("folderId");
    let folderId: string | null = null;
    if (typeof folderIdRaw === "string" && folderIdRaw.trim().length > 0) {
      const f = await prisma.companyDocumentFolder.findFirst({
        where: { id: folderIdRaw.trim(), companyId },
      });
      if (!f) {
        return NextResponse.json({ ok: false, error: "Carpeta no válida" }, { status: 400 });
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
        return NextResponse.json({ ok: false, error: "No puedes subir a esa carpeta" }, { status: 403 });
      }
      folderId = f.id;
    }

    const key = buildObjectKey(companyId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await putObjectBytes(key, buffer, contentType);
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Error al subir a R2" },
        { status: 500 },
      );
    }

    try {
      await prisma.companyDocument.create({
        data: {
          companyId,
          uploadedByUserId: userId,
          folderId,
          title,
          originalFilename: sanitizeFilename(file.name),
          storageKey: key,
          mimeType: contentType,
          sizeBytes: buffer.length,
          othersCanView,
          othersCanEdit,
          othersCanDelete,
        },
      });
    } catch (e) {
      try {
        await deleteObject(key);
      } catch {
        /* ignore cleanup failure */
      }
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Error al guardar el registro" },
        { status: 500 },
      );
    }

    revalidatePath("/documentos");
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error al procesar la subida" },
      { status: 500 },
    );
  }
}
