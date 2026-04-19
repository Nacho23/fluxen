import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: "Conexión OK con la base de datos",
    });
  } catch (error) {
    console.error("[test-db]", error);

    const message =
      error instanceof Error ? error.message : "Error desconocido al conectar";

    return NextResponse.json(
      {
        success: false,
        message: "Error conectando a la base de datos",
        error: message,
      },
      { status: 503 },
    );
  }
}
