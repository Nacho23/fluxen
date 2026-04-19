import type { ClientKind } from "@/lib/prisma/enums-public";

export const CLIENT_KIND_LABEL: Record<ClientKind, string> = {
  PERSON: "Persona natural",
  ORGANIZATION: "Empresa u organización",
};
