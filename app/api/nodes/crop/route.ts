// export const runtime = "nodejs";

// import { auth } from "@clerk/nextjs/server";
// import { tasks } from "@trigger.dev/sdk/v3";
// import type { cropImageTask } from "@/trigger/jobs/cropImage";
// import { z } from "zod";

// const Schema = z.object({
//   imageUrl: z.string().min(1),
//   x: z.number().default(10),
//   y: z.number().default(10),
//   width: z.number().default(80),
//   height: z.number().default(80),
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

//     console.log(`✂️ crop-image | node: ${parsed.data.nodeId ?? "?"}`);

//     const result = await tasks.triggerAndWait<typeof cropImageTask>(
//       "crop-image",
//       parsed.data,
//     );

//     if (result.ok) {
//       return Response.json({
//         success: true,
//         croppedUrl: result.output.croppedUrl,
//       });
//     } else {
//       return Response.json({ success: false, error: String(result.error) });
//     }
//   } catch (err) {
//     console.error("❌ /api/nodes/crop:", err);
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
  imageUrl: z.string().min(1),
  x: z.number().default(10),
  y: z.number().default(10),
  width: z.number().default(80),
  height: z.number().default(80),
  nodeId: z.string().optional(),
});

type CropTaskOutput = {
  croppedUrl: string;
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

    console.log(`✂️ crop-image | node: ${parsed.data.nodeId ?? "?"}`);

    // 🔥 Use tasks.trigger() from API routes, NOT triggerAndWait()
    const handle = await tasks.trigger("crop-image", parsed.data);

    console.log("⏳ Crop task triggered, polling...", handle.id);

    // ⏳ Poll until complete (max 30s)
    let output: CropTaskOutput | null = null;
    const timeout = Date.now() + 30_000;

    while (Date.now() < timeout) {
      const run = await runs.retrieve(handle.id);

      if (run.status === "COMPLETED") {
        output = run.output as CropTaskOutput;
        break;
      }

      if (
        run.status === "FAILED" ||
        run.status === "CANCELED" ||
        run.status === "CRASHED" ||
        run.status === "SYSTEM_FAILURE"
      ) {
        console.error("❌ Crop task failed with status:", run.status);
        return Response.json({
          success: false,
          error: `Crop task ${run.status.toLowerCase()}`,
        });
      }

      await new Promise((res) => setTimeout(res, 500));
    }

    if (!output) {
      return Response.json({
        success: false,
        error: "Crop task timed out after 30s",
      });
    }

    console.log("✅ Crop success:", output.croppedUrl);
    return Response.json({
      success: true,
      croppedUrl: output.croppedUrl,
    });
  } catch (err) {
    console.error("❌ /api/nodes/crop:", err);
    return Response.json(
      { success: false, error: String(err) },
      { status: 500 },
    );
  }
}
