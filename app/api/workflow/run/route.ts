export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import type { runLLMTask } from "@/trigger/jobs/runLLM";

const POLL_INTERVAL_MS = 1000;
const MAX_WAIT_MS = 60_000; // hard limit: 1 minute total
const MAX_QUEUE_WAIT_MS = 15_000; // run still not picked up -> stop early
const LIMIT_MESSAGE = "Limit exceeded. Please try again.";

// Run abhi tak worker ne uthaya nahi
const NOT_STARTED_STATUSES = [
  "PENDING_VERSION",
  "QUEUED",
  "DELAYED",
  "WAITING_FOR_DEPLOY",
];

const IN_PROGRESS_STATUSES = [
  ...NOT_STARTED_STATUSES,
  "DEQUEUED",
  "WAITING",
  "EXECUTING",
  "REATTEMPTING",
  "FROZEN",
];

export async function POST(req: Request) {
  const startedAt = Date.now();
  let dbRunId: string | null = null;

  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // `model` = dropdown choice ("default" or "provider:model")
    const { workflowId, nodeId, userMessage, systemPrompt, imageUrl, model } =
      await req.json();

    if (!userMessage?.trim()) {
      return Response.json(
        { success: false, error: "No userMessage provided" },
        { status: 400 },
      );
    }

    // Workflow lookup doubles as FK existence check (unsaved workflows skip the run record)
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

    const finish = async (
      status: "success" | "error",
      errorMessage?: string,
    ) => {
      if (!dbRunId) return;
      await prisma.workflowRun
        .update({
          where: { id: dbRunId },
          data: {
            status,
            duration: Date.now() - startedAt,
            errorMessage: errorMessage ?? null,
          },
        })
        .catch(() => {});
    };

    const stopRun = async (runId: string, reason: string) => {
      await runs.cancel(runId).catch(() => {});
      await finish("error", reason);
      return Response.json({
        success: false,
        output: LIMIT_MESSAGE,
        model: "none",
      });
    };

    // ── STEP 1: Fire the Trigger.dev task ──
    const handle = await tasks.trigger<typeof runLLMTask>("run-llm", {
      userMessage,
      systemPrompt: systemPrompt ?? null,
      imageUrl: imageUrl ?? null,
      model: model ?? null,
      workflowId,
      nodeId,
    });

    console.log(
      `Triggered run-llm | runId: ${handle.id} | model: ${model ?? "default"}`,
    );

    // ── STEP 2: Poll (max 1 minute, then cancel) ──
    let lastStatus = "";

    while (Date.now() - startedAt < MAX_WAIT_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const run = await runs.retrieve(handle.id);
      const status = run.status as string;
      const elapsed = Date.now() - startedAt;

      // Log only when status changes (no per-poll spam)
      if (status !== lastStatus) {
        console.log(
          `run-llm status: ${status} (${Math.round(elapsed / 1000)}s)`,
        );
        lastStatus = status;
      }

      // Worker ne run uthaya hi nahi -> jaldi band karo
      if (
        NOT_STARTED_STATUSES.includes(status) &&
        elapsed > MAX_QUEUE_WAIT_MS
      ) {
        console.warn(
          `run-llm stuck in ${status} for ${Math.round(elapsed / 1000)}s. Is "npx trigger.dev@latest dev" running? Cancelling.`,
        );
        return await stopRun(handle.id, `Run stuck in ${status}`);
      }

      if (IN_PROGRESS_STATUSES.includes(status)) continue;

      if (status === "COMPLETED") {
        const output = run.output as {
          success: boolean;
          output: string;
          model: string;
          provider?: string;
          fallback?: boolean;
        };

        await finish(
          output.success ? "success" : "error",
          output.success ? undefined : "LLM returned failure",
        );

        console.log(
          `run-llm completed | ${output.provider ?? "?"}:${output.model}`,
        );

        return Response.json({
          success: output.success,
          output: output.output,
          model: output.model,
          provider: output.provider ?? null,
        });
      }

      // Terminal failure (FAILED, CANCELED, CRASHED, TIMED_OUT, ...)
      console.warn(`run-llm ended with status: ${status}`);
      await finish("error", `LLM task failed with status: ${status}`);

      return Response.json({
        success: false,
        output: LIMIT_MESSAGE,
        model: "none",
      });
    }

    // 1 minute cross ho gaya -> LLM execution stop
    console.warn(`run-llm exceeded ${MAX_WAIT_MS / 1000}s. Cancelling run.`);
    return await stopRun(handle.id, "Request timed out");
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
