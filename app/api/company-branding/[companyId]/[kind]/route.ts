import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import {
  assertBrandingKeyBelongsToCompany,
  isR2Configured,
  presignGetObjectInline,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

function safeExternalImageUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function contentTypeFromKey(key: string): string {
  const k = key.toLowerCase();
  if (k.endsWith(".png")) return "image/png";
  if (k.endsWith(".webp")) return "image/webp";
  if (k.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ companyId: string; kind: string }> },
) {
  try {
    if (!isR2Configured()) {
      return new NextResponse(null, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const activeId = session?.activeCompanyId;
    const { companyId, kind } = await context.params;

    if (!userId || !activeId || companyId !== activeId) {
      return new NextResponse(null, { status: 403 });
    }

    const member = await prisma.companyMember.findFirst({
      where: { userId, companyId },
      select: { id: true },
    });
    if (!member) {
      return new NextResponse(null, { status: 403 });
    }

    if (kind !== "cover" && kind !== "avatar") {
      return new NextResponse(null, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        sidebarCoverStorageKey: true,
        sidebarAvatarStorageKey: true,
        sidebarCoverUrl: true,
        sidebarAvatarUrl: true,
      },
    });

    if (!company) {
      return new NextResponse(null, { status: 404 });
    }

    const key =
      kind === "cover" ? company.sidebarCoverStorageKey : company.sidebarAvatarStorageKey;
    if (!key) {
      const raw = kind === "cover" ? company.sidebarCoverUrl : company.sidebarAvatarUrl;
      const fallback = safeExternalImageUrl(raw);
      if (fallback) {
        return NextResponse.redirect(fallback, 302);
      }
      return new NextResponse(null, { status: 404 });
    }

    assertBrandingKeyBelongsToCompany(key, companyId);
    const contentType = contentTypeFromKey(key);
    const signed = await presignGetObjectInline(key, contentType);
    return NextResponse.redirect(signed, 302);
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
