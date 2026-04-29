

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 🔥 FIX: get real userId from Clerk instead of "temp_user_id"
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { id, name, nodes, edges } = body;

    console.log("🔥 Incoming:", {
      id,
      name,
      nodeCount: nodes?.length,
      edgeCount: edges?.length,
    });

    let workflow;

    if (id) {
      // UPDATE path — verify ownership before updating
      const existing = await prisma.workflow.findFirst({
        where: { id, userId }, // 🔥 must belong to this user
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Workflow not found or access denied" },
          { status: 404 },
        );
      }

      workflow = await prisma.workflow.update({
        where: { id },
        data: { name, nodes, edges, updatedAt: new Date() },
      });
      console.log("✅ Updated:", workflow.id);
    } else {
      // CREATE path — use real userId from Clerk
      workflow = await prisma.workflow.create({
        data: {
          userId, // 🔥 real Clerk userId
          name,
          nodes,
          edges,
        },
      });
      console.log("✅ Created:", workflow.id, "for user:", userId);
    }

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error("❌ DB ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
