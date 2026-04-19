import type { DefaultSession } from "next-auth";

export type SessionCompany = {
  id: string;
  name: string;
  role: string;
};

declare module "next-auth" {
  interface Session {
    activeCompanyId: string | null;
    companies: SessionCompany[];
    /** Permisos efectivos (empresa activa + rol) para menú y UI cliente. */
    permissions?: Record<string, boolean>;
    user: DefaultSession["user"] & { id: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    activeCompanyId?: string | null;
    companies?: SessionCompany[];
    permissions?: Record<string, boolean>;
    name?: string | null;
    email?: string | null;
  }
}
