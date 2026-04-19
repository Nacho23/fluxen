import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";


const APP_PREFIXES = [
  "/dashboard",
  "/perfil",
  "/usuarios",
  "/clientes",
  "/servicios",
  "/cotizaciones",
  "/agenda",
  "/ordenes",
  "/pagos",
  "/documentos",
  "/configuracion",
] as const;

function isAppPath(pathname: string) {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET;
  const token = secret
    ? await getToken({ req: request, secret })
    : null;

  const isLogin = pathname === "/login";

  if (isAppPath(pathname)) {
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    const companiesUnknown = (token as Record<string, unknown>).companies;
    const companyCount = Array.isArray(companiesUnknown)
      ? companiesUnknown.length
      : 0;
    if (
      companyCount === 0 &&
      pathname !== "/dashboard" &&
      pathname !== "/perfil"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    /* Permisos por módulo: la sesión incluye `permissions`; el control fino es en cada página y acción. */
    return NextResponse.next();
  }

  if (isLogin && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
