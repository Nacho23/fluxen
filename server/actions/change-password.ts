"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

const bodySchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña es demasiado larga"),
  confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
});

export async function changeMyPassword(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "No autorizado" };
  }

  const raw = {
    currentPassword:
      typeof formData.get("currentPassword") === "string"
        ? (formData.get("currentPassword") as string)
        : "",
    newPassword:
      typeof formData.get("newPassword") === "string"
        ? (formData.get("newPassword") as string)
        : "",
    confirmPassword:
      typeof formData.get("confirmPassword") === "string"
        ? (formData.get("confirmPassword") as string)
        : "",
  };

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const err = parsed.error.flatten().fieldErrors;
    const msg =
      err.newPassword?.[0] ??
      err.confirmPassword?.[0] ??
      "Datos no válidos";
    return { ok: false, error: msg };
  }

  const { newPassword, confirmPassword, currentPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "La confirmación no coincide con la nueva contraseña" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) {
    return { ok: false, error: "Usuario no encontrado" };
  }

  const hasPassword =
    typeof user.password === "string" && user.password.length > 0;

  if (hasPassword) {
    const cur = (currentPassword ?? "").trim();
    if (!cur) {
      return { ok: false, error: "Indica tu contraseña actual" };
    }
    const match = await bcrypt.compare(cur, user.password!);
    if (!match) {
      return { ok: false, error: "La contraseña actual no es correcta" };
    }
    const sameAsOld = await bcrypt.compare(newPassword, user.password!);
    if (sameAsOld) {
      return {
        ok: false,
        error: "La nueva contraseña debe ser distinta a la actual",
      };
    }
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hash },
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { ok: true };
}
