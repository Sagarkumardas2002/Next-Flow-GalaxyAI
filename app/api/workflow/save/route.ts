

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, nodes, edges } = body;

    console.log("🔥 Incoming:", body);

    let workflow;

    if (id) {
      // 🔥 ID present → UPDATE the existing workflow (no duplicates)
      workflow = await prisma.workflow.update({
        where: { id },
        data: {
          name,
          nodes,
          edges,
          updatedAt: new Date(),
        },
      });
      console.log("✅ Updated:", workflow.id);
    } else {
      // 🆕 No ID → CREATE a brand new workflow
      workflow = await prisma.workflow.create({
        data: {
          userId: "temp_user_id",
          name,
          nodes,
          edges,
        },
      });
      console.log("✅ Created:", workflow.id);
    }

    return NextResponse.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error("❌ DB ERROR:", error);

    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}









