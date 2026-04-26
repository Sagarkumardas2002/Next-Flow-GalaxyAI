// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function DELETE(req: Request) {
//   try {
//     const { id } = await req.json();

//     if (!id) {
//       return NextResponse.json(
//         { success: false, error: "Missing workflow id" },
//         { status: 400 },
//       );
//     }

//     await prisma.workflow.delete({
//       where: { id },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("DELETE ERROR:", error);

//     return NextResponse.json(
//       { success: false, error: String(error) },
//       { status: 500 },
//     );
//   }
// }
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing workflow id" },
        { status: 400 },
      );
    }

    // 🔥 FIX: verify this workflow belongs to the requesting user
    const existing = await prisma.workflow.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Workflow not found or access denied" },
        { status: 404 },
      );
    }

    await prisma.workflow.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
