import type { ClientKind } from "@prisma/client";

export const CLIENT_KIND_LABEL: Record<ClientKind, string> = {
  PERSON: "Persona natural",
  ORGANIZATION: "Empresa u organización",
};
