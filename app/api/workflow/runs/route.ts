export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runs = await prisma.workflowRun.findMany({
    where: { workflow: { userId } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json({ runs });
}
