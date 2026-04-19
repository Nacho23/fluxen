"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { parseProfileFormData } from "@/lib/user-profile/parse-profile-form-data";

export async function updateMyProfile(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "No autorizado" };
  }

  const parsed = parseProfileFormData(formData);
  if (!parsed.ok) {
    return parsed;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      rut: parsed.data.rut,
      phone: parsed.data.phone,
      address: parsed.data.address,
      bankName: parsed.data.bankName,
      bankAccountType: parsed.data.bankAccountType,
      bankAccountNumber: parsed.data.bankAccountNumber,
    },
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { ok: true };
}
