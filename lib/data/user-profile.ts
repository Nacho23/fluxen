import { prisma } from "@/lib/db/prisma";

export type UserProfileRow = {
  id: string;
  email: string;
  name: string;
  rut: string | null;
  phone: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  /** Si existe hash de contraseña en BD (login por credenciales). */
  hasPassword: boolean;
};

export async function getUserProfileById(userId: string): Promise<UserProfileRow | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      rut: true,
      phone: true,
      address: true,
      bankName: true,
      bankAccountType: true,
      bankAccountNumber: true,
      password: true,
    },
  });
  if (!u) return null;
  const { password, ...rest } = u;
  return {
    ...rest,
    hasPassword: typeof password === "string" && password.length > 0,
  };
}
