// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { name, nodes, edges } = body;

//     const workflow = await prisma.workflow.create({
//       data: {
//         userId: "temp_user_id", // later from Clerk
//         name,
//         nodes,
//         edges,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       data: workflow,
//     });
//   } catch (error) {
//     console.error("DB ERROR:", error);

//     return NextResponse.json(
//       { success: false, error: String(error) },
//       { status: 500 },
//     );
//   }
// }
export const runtime = "nodejs";

import { NextResponse } from "next/server"; // ✅ REQUIRED
import { prisma } from "@/lib/prisma"; // ✅ REQUIRED

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, nodes, edges } = body;

    console.log("🔥 Incoming:", body);

    const workflow = await prisma.workflow.create({
      data: {
        userId: "temp_user_id",
        name,
        nodes,
        edges,
      },
    });

    console.log("✅ Saved:", workflow);

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
