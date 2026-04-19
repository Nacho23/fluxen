import { z } from "zod";

import { isValidChileRut, normalizeRutInput } from "@/lib/validation/chile-rut";

const profileFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  rut: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(2000).optional(),
  bankName: z.string().trim().max(120).optional(),
  bankAccountType: z.string().trim().max(80).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
});

function emptyToNull(s: string | undefined): string | null {
  if (s == null || s.trim() === "") return null;
  return s.trim();
}

export type ParsedProfileUpdate = {
  name: string;
  rut: string | null;
  phone: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
};

export function parseProfileFormData(
  formData: FormData,
): { ok: true; data: ParsedProfileUpdate } | { ok: false; error: string } {
  const parsed = profileFormSchema.safeParse({
    name: formData.get("name"),
    rut: formData.get("rut"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    bankName: formData.get("bankName"),
    bankAccountType: formData.get("bankAccountType"),
    bankAccountNumber: formData.get("bankAccountNumber"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const rutRaw = emptyToNull(parsed.data.rut);
  if (rutRaw && !isValidChileRut(rutRaw)) {
    return { ok: false, error: "RUT no válido (usa formato chileno, ej. 12.345.678-5)" };
  }
  const rutStored = rutRaw ? normalizeRutInput(rutRaw) : null;

  return {
    ok: true,
    data: {
      name: parsed.data.name.trim(),
      rut: rutStored,
      phone: emptyToNull(parsed.data.phone),
      address: emptyToNull(parsed.data.address),
      bankName: emptyToNull(parsed.data.bankName),
      bankAccountType: emptyToNull(parsed.data.bankAccountType),
      bankAccountNumber: emptyToNull(parsed.data.bankAccountNumber),
    },
  };
}

/** Campos opcionales al invitar; el nombre puede ir vacío (se usa la parte local del correo). */
const inviteExtraSchema = z.object({
  name: z.string().trim().max(200).optional(),
  rut: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(2000).optional(),
  bankName: z.string().trim().max(120).optional(),
  bankAccountType: z.string().trim().max(80).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
});

export function parseInviteProfileExtras(
  formData: FormData,
):
  | { ok: true; data: ParsedProfileUpdate }
  | { ok: false; error: string } {
  const parsed = inviteExtraSchema.safeParse({
    name: formData.get("inviteName"),
    rut: formData.get("inviteRut"),
    phone: formData.get("invitePhone"),
    address: formData.get("inviteAddress"),
    bankName: formData.get("inviteBankName"),
    bankAccountType: formData.get("inviteBankAccountType"),
    bankAccountNumber: formData.get("inviteBankAccountNumber"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const rutRaw = emptyToNull(parsed.data.rut);
  if (rutRaw && !isValidChileRut(rutRaw)) {
    return { ok: false, error: "RUT no válido" };
  }
  const rutStored = rutRaw ? normalizeRutInput(rutRaw) : null;

  return {
    ok: true,
    data: {
      name: parsed.data.name?.trim() ? parsed.data.name.trim() : "",
      rut: rutStored,
      phone: emptyToNull(parsed.data.phone),
      address: emptyToNull(parsed.data.address),
      bankName: emptyToNull(parsed.data.bankName),
      bankAccountType: emptyToNull(parsed.data.bankAccountType),
      bankAccountNumber: emptyToNull(parsed.data.bankAccountNumber),
    },
  };
}
