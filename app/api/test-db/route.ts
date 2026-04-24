export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  console.log("ENV CHECK:", process.env.DATABASE_URL);

  try {
    const user = await prisma.user.create({
      data: {
        email: "test1@example.com",
        name: "Samar",
      },
    });

    return NextResponse.json({
      success: true,
      data: user, // ✅ FIXED
    });
  } catch (error) {
    console.error("DB ERROR:", error);

    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
