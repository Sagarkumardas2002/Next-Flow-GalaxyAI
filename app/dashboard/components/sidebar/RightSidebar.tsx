"use client";

import { useEffect, useState, useRef } from "react";
import { useWorkflow } from "../../hooks/useWorkflow";
import { useFlowStore } from "../../hooks/useFlowStore";
import type { Node, Edge } from "@xyflow/react";

type Workflow = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
  userId: string;
};

type RunEntry = {
  id: string;
  workflowId: string | null;
  workflowName: string;
  status: "running" | "success" | "error";
  startedAt: number;
  duration: number | null;
  nodeCount: number;
  type: "full" | "selected";
};

export default function RightSidebar() {
  const {
    getWorkflows,
    loadWorkflow,
    deleteWorkflow,
    clearWorkflow,
    restoreLastWorkflow,
  } = useWorkflow();

  const currentWorkflowId = useFlowStore((s) => s.workflowId);
  const workflowName = useFlowStore((s) => s.workflowName);
  const nodes = useFlowStore((s) => s.nodes);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "this">("all");

  // 🔥 FIX: stable "now" that ticks every 30s — never call Date.now() during render
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const activeRunRef = useRef<{ id: string; startedAt: number } | null>(null);
  const runCounterRef = useRef(0);

  // ── WORKFLOW LIST FETCH ──
  useEffect(() => {
    let isMounted = true;

    const initialFetch = async () => {
      setLoading(true);
      const data = await getWorkflows();
      if (isMounted) {
        setWorkflows(data || []);
        setLoading(false);
      }
      await restoreLastWorkflow();
    };

    initialFetch();

    const handleWorkflowSaved = (e: Event) => {
      const newWorkflow = (e as CustomEvent<Workflow>).detail;
      setWorkflows((prev) => {
        const exists = prev.find((wf) => wf.id === newWorkflow.id);
        if (exists) {
          return prev.map((wf) =>
            wf.id === newWorkflow.id ? newWorkflow : wf,
          );
        }
        return [newWorkflow, ...prev];
      });
    };

    window.addEventListener("workflow-saved", handleWorkflowSaved);
    return () => {
      isMounted = false;
      window.removeEventListener("workflow-saved", handleWorkflowSaved);
    };
  }, []);

  // ── RUN HISTORY LISTENERS ──
  useEffect(() => {
    const handleRunStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as { edgeIds: string[] };
      runCounterRef.current += 1;

      const runId = `run-${runCounterRef.current}`;
      const startedAt = Date.now(); // ✅ inside event handler, not render

      const llmNodeCount = nodes.filter((n) => n.type === "llmNode").length;

      const newRun: RunEntry = {
        id: runId,
        workflowId: currentWorkflowId,
        workflowName: workflowName || "Untitled Workflow",
        status: "running",
        startedAt,
        duration: null,
        nodeCount: llmNodeCount,
        type: detail?.edgeIds?.length ? "selected" : "full",
      };

      activeRunRef.current = { id: runId, startedAt };
      setNow(Date.now()); // refresh "ago" timestamps when a run starts
      setRuns((prev) => [newRun, ...prev]);
    };

    const handleRunEnd = () => {
      if (!activeRunRef.current) return;
      const { id, startedAt } = activeRunRef.current;
      const duration = Date.now() - startedAt; // ✅ inside event handler
      activeRunRef.current = null;

      setNow(Date.now()); // refresh "ago" timestamps when a run ends
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "success" as const, duration } : r,
        ),
      );
    };

    window.addEventListener("workflow-run-start", handleRunStart);
    window.addEventListener("workflow-run-end", handleRunEnd);
    return () => {
      window.removeEventListener("workflow-run-start", handleRunStart);
      window.removeEventListener("workflow-run-end", handleRunEnd);
    };
  }, [currentWorkflowId, workflowName, nodes]);

  // ── DELETE ──
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Delete this workflow?");
    if (!confirmDelete) return;
    const success = await deleteWorkflow(id);
    if (success) {
      setWorkflows((prev) => prev.filter((wf) => wf.id !== id));
      if (id === currentWorkflowId) clearWorkflow();
    } else {
      alert("Failed to delete");
    }
  };

  // ── HELPERS — use stable `now` state, never Date.now() directly ──
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
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const filteredRuns =
    activeTab === "this"
      ? runs.filter((r) => r.workflowId === currentWorkflowId)
      : runs;

  const ITEM_HEIGHT = 36;
  const VISIBLE_COUNT = 6;
  const containerHeight = ITEM_HEIGHT * VISIBLE_COUNT;

  return (
    <div className="w-[20px] min-w-[240px] bg-[#111] border-l border-[#222] flex flex-col">
      {/* ===================== */}
      {/* WORKFLOWS SECTION     */}
      {/* ===================== */}
      <div className="px-3 pt-4 pb-3 border-b border-[#222]">
        <h2 className="text-[13px] mb-5 font-semibold text-white text-center tracking-wide">
          Workflows
        </h2>

        <div className="h-px bg-[#222] my-3" />

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

        <div
          className="overflow-y-auto space-y-1.5 pr-1"
          style={{ height: `${containerHeight}px` }}
        >
          {loading &&
            Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
              <div
                key={i}
                style={{ height: `${ITEM_HEIGHT}px`, opacity: 1 - i * 0.13 }}
                className="shimmer-ltr flex items-center px-3 rounded-md border border-[#2a2a2a]"
              >
                <div className="h-3 w-4/4 rounded-full bg-[#333]" />
              </div>
            ))}

          {!loading && workflows.length === 0 && (
            <div className="flex items-center justify-center text-[10px] text-zinc-500 h-full">
              No workflows yet
            </div>
          )}

          {!loading &&
            workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => loadWorkflow(wf)}
                style={{ height: `${ITEM_HEIGHT}px` }}
                className={`group flex items-center gap-2 text-[11px] px-3 rounded-md border transition cursor-pointer
                  ${
                    wf.id === currentWorkflowId
                      ? "bg-[#1e1e2e] border-purple-700/60 text-purple-300"
                      : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#444] hover:bg-[#202020] text-zinc-300"
                  }`}
              >
                <span className="flex-1 truncate">{wf.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(wf.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                >
                  🗑
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* ===================== */}
      {/* HISTORY SECTION       */}
      {/* ===================== */}

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

      <div className="flex-1 p-2 overflow-y-auto">
        {filteredRuns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-1">
            <span className="text-[10px] text-zinc-600">No runs yet</span>
            <span className="text-[9px] text-zinc-700">Press Run to start</span>
          </div>
        )}

        {filteredRuns.map((run, index) => {
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
              className={`mb-2 p-2 rounded-md bg-[#1a1a1a] border ${
                run.status === "running" ? "border-[#333]" : "border-[#2a2a2a]"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
