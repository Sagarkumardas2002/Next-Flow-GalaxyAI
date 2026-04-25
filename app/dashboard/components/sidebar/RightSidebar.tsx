"use client";

import { useEffect, useState } from "react";
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

export default function RightSidebar() {
  const {
    getWorkflows,
    loadWorkflow,
    deleteWorkflow,
    clearWorkflow,
    restoreLastWorkflow,
  } = useWorkflow();

  // 🔥 Track which workflow is currently open on the canvas
  const currentWorkflowId = useFlowStore((s) => s.workflowId);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initialFetch = async () => {
      setLoading(true);
      const data = await getWorkflows();
      if (isMounted) {
        setWorkflows(data || []);
        setLoading(false);
      }

      // 🔥 After workflows load, restore the last opened workflow (refresh / re-login)
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

  // 🔥 DELETE — clears canvas + topbar name if the deleted workflow is currently open
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Delete this workflow?");
    if (!confirmDelete) return;

    const success = await deleteWorkflow(id);

    if (success) {
      setWorkflows((prev) => prev.filter((wf) => wf.id !== id));

      // 🔥 If the deleted workflow is the one open → wipe canvas & reset topbar
      if (id === currentWorkflowId) {
        clearWorkflow();
      }
    } else {
      alert("Failed to delete");
    }
  };

  const ITEM_HEIGHT = 36;
  const VISIBLE_COUNT = 6;
  const containerHeight = ITEM_HEIGHT * VISIBLE_COUNT;

  return (
    <div className="w-[240px] min-w-[240px] bg-[#111] border-l border-[#222] flex flex-col">
      {/* ===================== */}
      {/* 🔥 WORKFLOWS SECTION */}
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
          {/* ── LOADING SKELETONS ── */}
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

          {/* ── EMPTY STATE ── */}
          {!loading && workflows.length === 0 && (
            <div className="flex items-center justify-center text-[10px] text-zinc-500 h-full">
              No workflows yet
            </div>
          )}

          {/* ── WORKFLOW ITEMS ── */}
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

                {/* DELETE BUTTON */}
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
      {/* 🔥 HISTORY SECTION */}
      {/* ===================== */}

      <div className="mt-3" />

      {/* HEADER */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-[#222]">
        <span className="text-[11px] font-medium text-zinc-300">History</span>
        <span className="text-[9px] px-2 py-[2px] bg-[#222] rounded text-zinc-500">
          3 runs
        </span>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-2 border-b border-[#222]">
        <button className="text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-400">
          All Runs
        </button>
        <button className="text-[10px] px-2 py-1 rounded text-zinc-500 hover:text-zinc-300">
          This Workflow
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 p-2 overflow-y-auto">
        {/* RUN #3 */}
        <div className="mb-3 p-2 rounded-md bg-[#1a1a1a] border border-[#333]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[7px] h-[7px] rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[10px] text-zinc-200 flex-1">Run #3</span>
            <span className="text-[9px] px-1.5 py-[1px] bg-[#222] rounded text-zinc-500">
              Full
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 mb-2">
            Just now · running…
          </div>
        </div>

        {/* RUN #2 */}
        <div className="mb-3 p-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[7px] h-[7px] rounded-full bg-green-500" />
            <span className="text-[10px] text-zinc-200 flex-1">Run #2</span>
            <span className="text-[9px] px-1.5 py-[1px] bg-[#222] rounded text-zinc-500">
              Partial
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">
            2 min ago · 4.2s · 2 nodes
          </div>
        </div>

        {/* RUN #1 */}
        <div className="p-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[7px] h-[7px] rounded-full bg-red-500" />
            <span className="text-[10px] text-zinc-200 flex-1">Run #1</span>
            <span className="text-[9px] px-1.5 py-[1px] bg-[#222] rounded text-zinc-500">
              Full
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">
            8 min ago · failed · 1.1s
          </div>
        </div>
      </div>
    </div>
  );
}
