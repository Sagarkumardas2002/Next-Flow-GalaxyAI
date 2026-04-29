// export const runtime = "nodejs";

// import { auth } from "@clerk/nextjs/server";
// import { tasks } from "@trigger.dev/sdk/v3";
// import type { extractFrameTask } from "@/trigger/jobs/extractFrame";
// import { z } from "zod";

// const Schema = z.object({
//   videoUrl: z.string().min(1),
//   timestamp: z.string().default("50%"),
//   nodeId: z.string().optional(),
// });

// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId)
//       return Response.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const parsed = Schema.safeParse(body);
//     if (!parsed.success) {
//       return Response.json(
//         { success: false, error: parsed.error.flatten() },
//         { status: 400 },
//       );
//     }

//     console.log(`⬡ extract-frame | node: ${parsed.data.nodeId ?? "?"}`);

//     const result = await tasks.triggerAndWait<typeof extractFrameTask>(
//       "extract-frame",
//       parsed.data,
//     );

//     if (result.ok) {
//       return Response.json({ success: true, frameUrl: result.output.frameUrl });
//     } else {
//       return Response.json({ success: false, error: String(result.error) });
//     }
//   } catch (err) {
//     console.error("❌ /api/nodes/extract:", err);
//     return Response.json(
//       { success: false, error: String(err) },
//       { status: 500 },
//     );
//   }
// }

export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const Schema = z.object({
  videoUrl: z.string().min(1),
  timestamp: z.string().default("50%"),
  nodeId: z.string().optional(),
});

type ExtractTaskOutput = {
  frameUrl: string;
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    console.log(`⬡ extract-frame | node: ${parsed.data.nodeId ?? "?"}`);

    // 🔥 Use tasks.trigger() from API routes, NOT triggerAndWait()
    const handle = await tasks.trigger("extract-frame", parsed.data);

    console.log("⏳ Extract task triggered, polling...", handle.id);

    // ⏳ Poll until complete (max 60s — frame extraction can be slow)
    let output: ExtractTaskOutput | null = null;
    const timeout = Date.now() + 60_000;

    while (Date.now() < timeout) {
      const run = await runs.retrieve(handle.id);

      if (run.status === "COMPLETED") {
        output = run.output as ExtractTaskOutput;
        break;
      }

      if (
        run.status === "FAILED" ||
        run.status === "CANCELED" ||
        run.status === "CRASHED" ||
        run.status === "SYSTEM_FAILURE"
      ) {
        console.error("❌ Extract task failed with status:", run.status);
        return Response.json({
          success: false,
          error: `Extract task ${run.status.toLowerCase()}`,
        });
      }

      await new Promise((res) => setTimeout(res, 500));
    }

    if (!output) {
      return Response.json({
        success: false,
        error: "Extract task timed out after 60s",
      });
    }

    console.log("✅ Extract success:", output.frameUrl);
    return Response.json({ success: true, frameUrl: output.frameUrl });
  } catch (err) {
    console.error("❌ /api/nodes/extract:", err);
    return Response.json(
      { success: false, error: String(err) },
      { status: 500 },
    );
  }
}
