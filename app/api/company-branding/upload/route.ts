import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { CompanyRole } from "@/lib/prisma/enums-public";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import { isAllowedBrandingImageUpload } from "@/lib/branding/allowed-branding-image";
import { prisma } from "@/lib/db/prisma";
import {
  assertBrandingKeyBelongsToCompany,
  buildBrandingObjectKey,
  deleteObject,
  isR2Configured,
  MAX_BRANDING_IMAGE_BYTES,
  putObjectBytes,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { ok: false, error: "Almacenamiento R2 no configurado" },
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
    if (role !== CompanyRole.OWNER) {
      return NextResponse.json(
        { ok: false, error: "Solo el propietario puede subir imágenes de marca" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const kindRaw = formData.get("kind");
    const kind = kindRaw === "cover" || kindRaw === "avatar" ? kindRaw : null;
    if (!kind) {
      return NextResponse.json({ ok: false, error: "Tipo no válido" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size < 1) {
      return NextResponse.json({ ok: false, error: "Selecciona una imagen" }, { status: 400 });
    }
    if (file.size > MAX_BRANDING_IMAGE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `La imagen supera el máximo de ${MAX_BRANDING_IMAGE_BYTES / (1024 * 1024)} MB` },
        { status: 400 },
      );
    }

    const contentType = file.type.trim() || "application/octet-stream";
    if (!isAllowedBrandingImageUpload(file.name, contentType)) {
      return NextResponse.json(
        { ok: false, error: "Formato no permitido (JPEG, PNG, WebP o GIF)" },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        sidebarCoverStorageKey: true,
        sidebarAvatarStorageKey: true,
      },
    });
    if (!company) {
      return NextResponse.json({ ok: false, error: "Empresa no encontrada" }, { status: 404 });
    }

    const prevKey =
      kind === "cover" ? company.sidebarCoverStorageKey : company.sidebarAvatarStorageKey;

    const key = buildBrandingObjectKey(companyId, kind, file.name);
    assertBrandingKeyBelongsToCompany(key, companyId);

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      await putObjectBytes(key, buffer, normalizeImageContentType(contentType, file.name));
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Error al subir imagen" },
        { status: 500 },
      );
    }

    const data =
      kind === "cover"
        ? { sidebarCoverStorageKey: key, sidebarCoverUrl: null }
        : { sidebarAvatarStorageKey: key, sidebarAvatarUrl: null };

    await prisma.company.update({
      where: { id: companyId },
      data,
    });

    if (prevKey && prevKey !== key) {
      try {
        assertBrandingKeyBelongsToCompany(prevKey, companyId);
        await deleteObject(prevKey);
      } catch {
        /* clave previa inválida o borrado fallido: no bloquear */
      }
    }

    revalidatePath("/configuracion");
    revalidatePath("/configuracion/preferencias");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return NextResponse.json({
      ok: true as const,
      publicPath: `/api/company-branding/${companyId}/${kind}`,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error al procesar la subida" },
      { status: 500 },
    );
  }
}

function normalizeImageContentType(mime: string, filename: string): string {
  const m = mime.split(";")[0]?.trim().toLowerCase() || "";
  if (m.startsWith("image/")) return m;
  const ext = filename.replace(/^.*[/\\]/, "").toLowerCase();
  if (ext.endsWith(".png")) return "image/png";
  if (ext.endsWith(".webp")) return "image/webp";
  if (ext.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}
