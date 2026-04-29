// export const runtime = "nodejs";

// import { auth } from "@clerk/nextjs/server";

// const GEMINI_MODELS = [
//   "gemini-2.5-flash",
//   "gemini-2.0-flash",
//   "gemini-1.5-flash",
// ];

// async function fetchImageAsBase64(
//   url: string,
// ): Promise<{ data: string; mimeType: string }> {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
//   const contentType = res.headers.get("content-type") ?? "image/jpeg";
//   const mimeType = contentType.split(";")[0].trim();
//   const buffer = await res.arrayBuffer();
//   const data = Buffer.from(buffer).toString("base64");
//   return { data, mimeType };
// }

// async function callGemini(
//   userMessage: string,
//   systemPrompt?: string | null,
//   imageUrl?: string | null,
// ): Promise<{ output: string; model: string; fallback?: boolean }> {
//   const skipped: string[] = [];

//   let imageData: { data: string; mimeType: string } | null = null;
//   if (imageUrl) {
//     try {
//       imageData = await fetchImageAsBase64(imageUrl);
//     } catch (err) {
//       console.warn(`⚠️ Could not load image, running text-only: ${err}`);
//     }
//   }

//   for (const model of GEMINI_MODELS) {
//     try {
//       const parts: object[] = [];

//       if (imageData) {
//         parts.push({
//           inline_data: {
//             mime_type: imageData.mimeType,
//             data: imageData.data,
//           },
//         });
//       }

//       parts.push({ text: userMessage });

//       const res = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             contents: [{ role: "user", parts }],
//             ...(systemPrompt && {
//               systemInstruction: { parts: [{ text: systemPrompt }] },
//             }),
//           }),
//         },
//       );

//       const data = await res.json();

//       if (data?.error) {
//         const type = data.error.code === 429 ? "quota" : "not_found";
//         skipped.push(`${model}(${type})`);
//         await new Promise((r) => setTimeout(r, 500));
//         continue;
//       }

//       const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//       if (!output) {
//         skipped.push(`${model}(empty)`);
//         continue;
//       }

//       console.log(
//         skipped.length > 0
//           ? `⚡ skipped: [${skipped.join(", ")}] → ✅ ${model}`
//           : `✅ model: ${model}`,
//       );

//       return { output, model };
//     } catch {
//       skipped.push(`${model}(network)`);
//       await new Promise((r) => setTimeout(r, 500));
//     }
//   }

//   const hasQuota = skipped.some((s) => s.includes("quota"));
//   return {
//     output: hasQuota
//       ? "Rate limit reached. Please wait a moment and try again."
//       : "AI models are currently unavailable. Please try again later.",
//     model: "none",
//     fallback: true,
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { userMessage, systemPrompt, imageUrl } = await req.json();

//     if (!userMessage?.trim()) {
//       return Response.json(
//         { success: false, error: "No userMessage provided" },
//         { status: 400 },
//       );
//     }

//     if (!process.env.GEMINI_API_KEY) {
//       return Response.json(
//         { success: false, error: "GEMINI_API_KEY missing" },
//         { status: 500 },
//       );
//     }

//     console.log(`📝 userMessage: ${userMessage}`);
//     console.log(`🎭 systemPrompt: ${systemPrompt ?? "none"}`);
//     console.log(`🖼️ imageUrl: ${imageUrl ?? "none"}`);

//     const { output, model, fallback } = await callGemini(
//       userMessage,
//       systemPrompt,
//       imageUrl,
//     );

//     return Response.json({ success: !fallback, output, model });
//   } catch (err) {
//     console.error("POST /api/workflow/run error:", err);
//     return Response.json(
//       { success: false, error: String(err), output: "Server error." },
//       { status: 500 },
//     );
//   }
// }

// export const runtime = "nodejs";
// import { auth } from "@clerk/nextjs/server";
// import { tasks, runs } from "@trigger.dev/sdk/v3";
// import type { runLLMTask } from "@/trigger/jobs/runLLM";

// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { workflowId, nodeId, userMessage, systemPrompt, imageUrl } =
//       await req.json();

//     if (!userMessage?.trim()) {
//       return Response.json(
//         { success: false, error: "No userMessage provided" },
//         { status: 400 },
//       );
//     }

//     // ── STEP 1: Fire the Trigger.dev task ──
//     const handle = await tasks.trigger<typeof runLLMTask>("run-llm", {
//       userMessage,
//       systemPrompt: systemPrompt ?? null,
//       imageUrl: imageUrl ?? null,
//       workflowId,
//       nodeId,
//     });

//     console.log(`🚀 Triggered run-llm | runId: ${handle.id}`);

//     // ── STEP 2: Poll until complete (max 2 min) ──
//     const maxAttempts = 60;
//     let attempts = 0;

//     const IN_PROGRESS_STATUSES = [
//       "PENDING_VERSION",
//       "DEQUEUED",
//       "WAITING",
//       "EXECUTING", // ← was missing, causing early failure
//       "REATTEMPTING",
//       "FROZEN",
//       "DELAYED",
//       "WAITING_FOR_DEPLOY",
//       "QUEUED",
//     ];

//     while (attempts < maxAttempts) {
//       await new Promise((r) => setTimeout(r, 2000));
//       attempts++;

//       const run = await runs.retrieve(handle.id);
//       console.log(`🔄 Poll #${attempts}: ${run.status}`);

//       // Still in progress — keep polling
//       if (IN_PROGRESS_STATUSES.includes(run.status as string)) {
//         continue;
//       }

//       // Successfully completed
//       if (run.status === "COMPLETED") {
//         const output = run.output as {
//           success: boolean;
//           output: string;
//           model: string;
//           fallback?: boolean;
//         };

//         console.log(`✅ run-llm completed | model: ${output.model}`);

//         return Response.json({
//           success: output.success,
//           output: output.output,
//           model: output.model,
//         });
//       }

//       // Any other status is a terminal failure
//       console.warn(`❌ run-llm ended with status: ${run.status}`);
//       return Response.json({
//         success: false,
//         output: `LLM task failed with status: ${run.status}. Please try again.`,
//         model: "none",
//       });
//     }

//     // Timed out
//     return Response.json({
//       success: false,
//       output: "Request timed out. Please try again.",
//       model: "none",
//     });
//   } catch (err) {
//     console.error("POST /api/workflow/run error:", err);
//     return Response.json(
//       { success: false, error: String(err), output: "Server error." },
//       { status: 500 },
//     );
//   }
// }

export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import type { runLLMTask } from "@/trigger/jobs/runLLM";

export async function POST(req: Request) {
  const startedAt = Date.now();
  let dbRunId: string | null = null;

  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId, nodeId, userMessage, systemPrompt, imageUrl } =
      await req.json();

    if (!userMessage?.trim()) {
      return Response.json(
        { success: false, error: "No userMessage provided" },
        { status: 400 },
      );
    }

    // ── Get workflow info for history ──
    // Also serves as the FK existence check — if workflow isn't in DB yet
    // (unsaved), workflow will be null and we skip the run record entirely.
    const workflow = workflowId
      ? await prisma.workflow.findUnique({ where: { id: workflowId } })
      : null;

    const nodeCount = (() => {
      try {
        const parsed = JSON.parse(JSON.stringify(workflow?.nodes ?? []));
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    })();

    // ── Create run record only when workflow exists in DB ──
    // Skipped for unsaved workflows to avoid FK constraint violation (P2003).
    if (workflow) {
      const dbRun = await prisma.workflowRun.create({
        data: {
          workflowId,
          workflowName: workflow.name ?? "Untitled Workflow",
          type: "full",
          nodeCount,
          status: "running",
        },
      });
      dbRunId = dbRun.id;
    }

    // ── STEP 1: Fire the Trigger.dev task ──
    const handle = await tasks.trigger<typeof runLLMTask>("run-llm", {
      userMessage,
      systemPrompt: systemPrompt ?? null,
      imageUrl: imageUrl ?? null,
      workflowId,
      nodeId,
    });

    console.log(`🚀 Triggered run-llm | runId: ${handle.id}`);

    // ── STEP 2: Poll until complete (max 2 min) ──
    const maxAttempts = 60;
    let attempts = 0;

    const IN_PROGRESS_STATUSES = [
      "PENDING_VERSION",
      "DEQUEUED",
      "WAITING",
      "EXECUTING",
      "REATTEMPTING",
      "FROZEN",
      "DELAYED",
      "WAITING_FOR_DEPLOY",
      "QUEUED",
    ];

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;

      const run = await runs.retrieve(handle.id);
      console.log(`🔄 Poll #${attempts}: ${run.status}`);

      if (IN_PROGRESS_STATUSES.includes(run.status as string)) {
        continue;
      }

      if (run.status === "COMPLETED") {
        const output = run.output as {
          success: boolean;
          output: string;
          model: string;
          fallback?: boolean;
        };

        const duration = Date.now() - startedAt;

        if (dbRunId) {
          await prisma.workflowRun.update({
            where: { id: dbRunId },
            data: {
              status: output.success ? "success" : "error",
              duration,
              errorMessage: output.success ? null : "LLM returned failure",
            },
          });
        }

        console.log(`✅ run-llm completed | model: ${output.model}`);

        return Response.json({
          success: output.success,
          output: output.output,
          model: output.model,
        });
      }

      // Terminal failure
      const duration = Date.now() - startedAt;
      const errorMessage = `LLM task failed with status: ${run.status}`;

      if (dbRunId) {
        await prisma.workflowRun.update({
          where: { id: dbRunId },
          data: { status: "error", duration, errorMessage },
        });
      }

      console.warn(`❌ run-llm ended with status: ${run.status}`);
      return Response.json({
        success: false,
        output: `${errorMessage}. Please try again.`,
        model: "none",
      });
    }

    // Timed out
    const duration = Date.now() - startedAt;
    if (dbRunId) {
      await prisma.workflowRun.update({
        where: { id: dbRunId },
        data: { status: "error", duration, errorMessage: "Request timed out" },
      });
    }

    return Response.json({
      success: false,
      output: "Request timed out. Please try again.",
      model: "none",
    });
  } catch (err) {
    if (dbRunId) {
      await prisma.workflowRun
        .update({
          where: { id: dbRunId },
          data: {
            status: "error",
            duration: Date.now() - startedAt,
            errorMessage: String(err),
          },
        })
        .catch(() => {});
    }

    console.error("POST /api/workflow/run error:", err);
    return Response.json(
      { success: false, error: String(err), output: "Server error." },
      { status: 500 },
    );
  }
}
