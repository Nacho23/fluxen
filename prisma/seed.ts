import "dotenv/config";

import bcrypt from "bcrypt";

import { prisma } from "@/lib/db/prisma";

async function main() {
  const password = await bcrypt.hash("demo1234", 10);

  await prisma.user.upsert({
    where: { email: "demo@fluxen.local" },
    update: { password },
    create: {
      email: "demo@fluxen.local",
      name: "Usuario demo",
      password,
    },
  });

  console.log(
    "Seed OK: demo@fluxen.local / demo1234 (sin empresas: tras el login crea la primera en el panel)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
