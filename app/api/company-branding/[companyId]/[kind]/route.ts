import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import {
  assertBrandingKeyBelongsToCompany,
  getObjectBytes,
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

async function proxyExternalImage(url: string): Promise<NextResponse> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    return new NextResponse(null, { status: 404 });
  }
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const body = new Uint8Array(await res.arrayBuffer());
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ companyId: string; kind: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const activeId = session?.activeCompanyId;
    const { companyId, kind } = await context.params;
    const embed = new URL(request.url).searchParams.get("embed") === "1";

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

    if (kind !== "cover" && kind !== "avatar" && kind !== "logo") {
      return new NextResponse(null, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        sidebarCoverStorageKey: true,
        sidebarAvatarStorageKey: true,
        sidebarCoverUrl: true,
        sidebarAvatarUrl: true,
        logoStorageKey: true,
        logoUrl: true,
      },
    });

    if (!company) {
      return new NextResponse(null, { status: 404 });
    }

    const key =
      kind === "cover"
        ? company.sidebarCoverStorageKey
        : kind === "avatar"
          ? company.sidebarAvatarStorageKey
          : company.logoStorageKey;

    const rawExternal =
      kind === "cover"
        ? company.sidebarCoverUrl
        : kind === "avatar"
          ? company.sidebarAvatarUrl
          : company.logoUrl;

    if (!key) {
      const fallback = safeExternalImageUrl(rawExternal);
      if (!fallback) {
        return new NextResponse(null, { status: 404 });
      }
      if (embed) {
        return proxyExternalImage(fallback);
      }
      return NextResponse.redirect(fallback, 302);
    }

    if (!isR2Configured()) {
      return new NextResponse(null, { status: 503 });
    }

    assertBrandingKeyBelongsToCompany(key, companyId);
    const contentType = contentTypeFromKey(key);

    if (embed) {
      const { body } = await getObjectBytes(key);
      return new NextResponse(new Uint8Array(body), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=300",
        },
      });
    }

    const signed = await presignGetObjectInline(key, contentType);
    return NextResponse.redirect(signed, 302);
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
