

"use client";

import { useEffect, useState, useRef } from "react";
import { useFlowStore } from "../../hooks/useFlowStore";

type RunEntry = {
  id: string;
  workflowId: string | null;
  workflowName: string;
  status: "running" | "success" | "error";
  startedAt: number;
  duration: number | null;
  nodeCount: number;
  type: "full" | "selected";
  errorMessage?: string;
};

// async function fetchRunsFromDB(): Promise<RunEntry[]> {
//   try {
//     const res = await fetch("/api/workflow/runs");
//     const json = await res.json();
//     return (json.runs ?? []).map((r: any) => ({
//       id: r.id,
//       workflowId: r.workflowId,
//       workflowName: r.workflowName ?? "Untitled Workflow",
//       // any run still "running" in DB = was interrupted by reload
//       status: r.status === "running" ? "error" : r.status,
//       startedAt: new Date(r.createdAt).getTime(),
//       duration: r.duration ?? null,
//       nodeCount: r.nodeCount ?? 0,
//       type: r.type ?? "full",
//       errorMessage:
//         r.status === "running"
//           ? "Interrupted by page reload"
//           : (r.errorMessage ?? undefined),
//     }));
//   } catch {
//     return [];
//   }
// }


type DBRun = {
  id: string;
  workflowId: string;
  workflowName: string | null;
  status: string;
  createdAt: string;
  duration: number | null;
  nodeCount: number;
  type: string | null;
  errorMessage: string | null;
};

async function fetchRunsFromDB(): Promise<RunEntry[]> {
  try {
    const res = await fetch("/api/workflow/runs");
    const json = (await res.json()) as { runs?: DBRun[] };
    return (json.runs ?? []).map((r: DBRun) => ({
      id: r.id,
      workflowId: r.workflowId,
      workflowName: r.workflowName ?? "Untitled Workflow",
      status: (r.status === "running" ? "error" : r.status) as
        | "running"
        | "success"
        | "error",
      startedAt: new Date(r.createdAt).getTime(),
      duration: r.duration ?? null,
      nodeCount: r.nodeCount ?? 0,
      type: (r.type === "selected" ? "selected" : "full") as
        | "full"
        | "selected",
      errorMessage:
        r.status === "running"
          ? "Interrupted by page reload"
          : (r.errorMessage ?? undefined),
    }));
  } catch {
    return [];
  }
}
export default function RightSidebarRunHistory() {
  const currentWorkflowId = useFlowStore((s) => s.workflowId);
  const workflowName = useFlowStore((s) => s.workflowName);
  const nodes = useFlowStore((s) => s.nodes);

  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "this">("all");
  const [loading, setLoading] = useState(true);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch from DB on mount
  useEffect(() => {
    fetchRunsFromDB().then((dbRuns) => {
      setRuns(dbRuns);
      setLoading(false);
    });
  }, []);

  const activeRunRef = useRef<{ id: string; startedAt: number } | null>(null);
  const runCounterRef = useRef(0);

  useEffect(() => {
    const handleRunStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as { edgeIds: string[] };
      runCounterRef.current += 1;

      const localId = `local-${Date.now()}-${runCounterRef.current}`;
      const startedAt = Date.now();
      const llmNodeCount = nodes.filter((n) => n.type === "llmNode").length;

      // Show optimistic "running" entry immediately
      const newRun: RunEntry = {
        id: localId,
        workflowId: currentWorkflowId,
        workflowName: workflowName || "Untitled Workflow",
        status: "running",
        startedAt,
        duration: null,
        nodeCount: llmNodeCount,
        type: detail?.edgeIds?.length ? "selected" : "full",
      };

      activeRunRef.current = { id: localId, startedAt };
      setNow(Date.now());
      setRuns((prev) => [newRun, ...prev]);
    };

    const handleRunEnd = async () => {
      if (!activeRunRef.current) return;
      activeRunRef.current = null;

      // Wait briefly for DB write in route.ts to commit, then re-fetch
      setTimeout(async () => {
        const dbRuns = await fetchRunsFromDB();
        setRuns(dbRuns);
        setNow(Date.now());
      }, 800);
    };

    const handleRunError = async (e: Event) => {
      if (!activeRunRef.current) return;
      const { id, startedAt } = activeRunRef.current;
      const duration = Date.now() - startedAt;
      const detail = (e as CustomEvent).detail as
        | { error?: string }
        | undefined;
      activeRunRef.current = null;

      // Update optimistic entry immediately
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "error" as const,
                duration,
                errorMessage: detail?.error ?? "Run failed",
              }
            : r,
        ),
      );

      // Then sync from DB
      setTimeout(async () => {
        const dbRuns = await fetchRunsFromDB();
        setRuns(dbRuns);
        setNow(Date.now());
      }, 800);
    };

    window.addEventListener("workflow-run-start", handleRunStart);
    window.addEventListener("workflow-run-end", handleRunEnd);
    window.addEventListener("workflow-run-error", handleRunError);
    return () => {
      window.removeEventListener("workflow-run-start", handleRunStart);
      window.removeEventListener("workflow-run-end", handleRunEnd);
      window.removeEventListener("workflow-run-error", handleRunError);
    };
  }, [currentWorkflowId, workflowName, nodes]);

  const formatTime = (ms: number | null): string => {
    if (ms === null) return "running…";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatAgo = (ts: number): string => {
    if (now === 0) return "just now";
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filteredRuns =
    activeTab === "this"
      ? runs.filter((r) => r.workflowId === currentWorkflowId)
      : runs;

  return (
    <>
      <div className="mt-3" />
      <div className="h-12 flex items-center justify-between px-3 border-b border-[#222]">
        <span className="text-[11px] font-medium text-zinc-300">History</span>
        <span className="text-[9px] px-2 py-[2px] bg-[#222] rounded text-zinc-500">
          {filteredRuns.length} {filteredRuns.length === 1 ? "run" : "runs"}
        </span>
      </div>

      <div className="flex gap-1 p-2 border-b border-[#222]">
        <button
          onClick={() => setActiveTab("all")}
          className={`text-[10px] px-2 py-1 rounded transition ${
            activeTab === "all"
              ? "bg-purple-500/10 text-purple-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          All Runs
        </button>
        <button
          onClick={() => setActiveTab("this")}
          className={`text-[10px] px-2 py-1 rounded transition ${
            activeTab === "this"
              ? "bg-purple-500/10 text-purple-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          This Workflow
        </button>
      </div>

      <style>{`
        @keyframes shimmer-ltr {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-ltr {
          position: relative;
          overflow: hidden;
          background: #1a1a1a;
        }
        .shimmer-ltr::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #2e2e2e 50%,
            transparent 100%
          );
          animation: shimmer-ltr 1.4s ease infinite;
        }
      `}</style>

      <div className="flex-1 p-2 overflow-y-auto">
        {loading && (
          <div className="space-y-2 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{ opacity: 1 - i * 0.18 }}
                className="shimmer-ltr rounded-md border border-[#2a2a2a] p-2"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-[7px] h-[7px] rounded-full bg-[#333] flex-shrink-0" />
                  <div className="h-2.5 w-2/3 rounded-full bg-[#333]" />
                  <div className="ml-auto h-2 w-10 rounded bg-[#2a2a2a]" />
                </div>
                <div className="flex gap-2">
                  <div className="h-2 w-10 rounded-full bg-[#2a2a2a]" />
                  <div className="h-2 w-8 rounded-full bg-[#2a2a2a]" />
                  <div className="h-2 w-12 rounded-full bg-[#2a2a2a]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredRuns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-1">
            <span className="text-[10px] text-zinc-600">No runs yet</span>
            <span className="text-[9px] text-zinc-700">Press Run to start</span>
          </div>
        )}

        {!loading &&
          filteredRuns.map((run, index) => {
            const runNumber = filteredRuns.length - index;
            const dotColor =
              run.status === "running"
                ? "bg-yellow-400 animate-pulse"
                : run.status === "success"
                  ? "bg-green-500"
                  : "bg-red-500";

            return (
              <div
                key={run.id}
                className={`mb-2 p-2 rounded-md border transition-colors ${
                  run.status === "running"
                    ? "bg-[#1a1a1a] border-[#333]"
                    : run.status === "error"
                      ? "bg-red-950/20 border-red-900/40"
                      : "bg-[#1a1a1a] border-[#2a2a2a]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${dotColor}`}
                  />
                  <span className="text-[10px] text-zinc-200 flex-1 truncate">
                    Run #{runNumber}
                    {run.workflowName && (
                      <span className="text-zinc-500 ml-1">
                        · {run.workflowName}
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] px-1.5 py-[1px] bg-[#222] rounded text-zinc-500 flex-shrink-0">
                    {run.type === "full" ? "Full" : "Selected"}
                  </span>
                </div>

                <div className="text-[9px] text-zinc-500 flex gap-1 flex-wrap">
                  <span>{formatAgo(run.startedAt)}</span>
                  <span>·</span>
                  <span>{formatTime(run.duration)}</span>
                  {run.nodeCount > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        {run.nodeCount} {run.nodeCount === 1 ? "node" : "nodes"}
                      </span>
                    </>
                  )}
                  {run.status === "error" && (
                    <>
                      <span>·</span>
                      <span className="text-red-400">failed</span>
                    </>
                  )}
                </div>

                {run.status === "error" && run.errorMessage && (
                  <div
                    className="mt-1.5 text-[9px] text-red-400/80 bg-red-950/30 rounded px-1.5 py-1 leading-tight truncate"
                    title={run.errorMessage}
                  >
                    {run.errorMessage}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}