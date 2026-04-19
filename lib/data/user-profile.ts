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
    },
  });
  return u;
}
