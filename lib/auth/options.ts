import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { flattenRoleToSnapshot } from "@/lib/auth/company-permissions";
import { getMergedPermissionMatrix } from "@/lib/data/company-permission-matrix";
import { parseCompanyRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import type { SessionCompany } from "@/types/next-auth";

async function loadMemberships(userId: string): Promise<SessionCompany[]> {
  const rows = await prisma.companyMember.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((m) => ({
    id: m.company.id,
    name: m.company.name,
    role: m.role,
  }));
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const userId = (user?.id ?? token.sub) as string | undefined;

      if (user && userId) {
        token.sub = userId;
        token.name = user.name;
        token.email = user.email;
        const companies = await loadMemberships(userId);
        token.companies = companies;
        token.activeCompanyId = companies[0]?.id ?? null;
      }

      if (trigger === "update" && userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.email = dbUser.email;
        }
        const companies = await loadMemberships(userId);
        token.companies = companies;
        const nextId =
          typeof session?.activeCompanyId === "string"
            ? session.activeCompanyId
            : undefined;
        if (nextId && companies.some((c) => c.id === nextId)) {
          token.activeCompanyId = nextId;
        } else if (
          !token.activeCompanyId ||
          !companies.some((c) => c.id === token.activeCompanyId)
        ) {
          token.activeCompanyId = companies[0]?.id ?? null;
        }
      }

      if (userId && token.activeCompanyId && token.companies) {
        const companies = token.companies as SessionCompany[];
        const activeId = token.activeCompanyId as string;
        const row = companies.find((c) => c.id === activeId);
        const role = row?.role ? parseCompanyRole(row.role) : null;
        if (role && activeId) {
          const matrix = await getMergedPermissionMatrix(activeId);
          token.permissions = flattenRoleToSnapshot(matrix, role);
        } else {
          token.permissions = undefined;
        }
      } else {
        token.permissions = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
        session.activeCompanyId = (token.activeCompanyId as string | null) ?? null;
        session.companies = (token.companies as SessionCompany[]) ?? [];
        session.permissions = (token.permissions as Record<string, boolean> | undefined) ?? undefined;
      }
      return session;
    },
  },
};
