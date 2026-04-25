"use client";

import { useEffect, useState } from "react";
import { useWorkflow } from "../../hooks/useWorkflow";
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
  const { getWorkflows, loadWorkflow } = useWorkflow();
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
  }, []); // ✅ FIXED

  const ITEM_HEIGHT = 36;
  const VISIBLE_COUNT = 6;
  const containerHeight = ITEM_HEIGHT * VISIBLE_COUNT;

  return (
    <div className="w-[240px] min-w-[240px] bg-[#111] border-l border-[#222] flex flex-col">
      {/* ===================== */}
      {/* 🔥 WORKFLOWS SECTION */}
      {/* ===================== */}
      <div className="px-3 pt-4 pb-3 border-b border-[#222]">
        {/* TITLE */}
        <h2 className="text-[13px] mb-5 font-semibold text-white text-center tracking-wide">
          Workflows
        </h2>
        {/* DIVIDER */}
        <div className="h-px bg-[#222] my-3" />

        {/* SCROLL AREA — fixed height always reserves space for 5 items */}
        <div
          className="overflow-y-auto space-y-1.5 pr-1"
          style={{ height: `${containerHeight}px` }}
        >
          {workflows.length === 0 && (
            <div
              className="flex items-center justify-center text-[10px] text-zinc-500"
              style={{ height: `${containerHeight}px` }}
            >
              No workflows yet
            </div>
          )}

          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => loadWorkflow(wf)}
              style={{ height: `${ITEM_HEIGHT}px` }}
              className="group flex items-center gap-2 text-[11px] px-3 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444] hover:bg-[#202020] transition cursor-pointer"
            >
              <span className="flex-1 truncate">{wf.name}</span>

              {/* Delete Button (UI only) */}
              <button
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 cursor-pointer"
                title="Delete workflow"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 4h12M5 4V2.5A.5.5 0 0 1 5.5 2h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9.5A.5.5 0 0 0 4.5 14h7a.5.5 0 0 0 .5-.5L13 4" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===================== */}
      {/* 🔥 HISTORY SECTION   */}
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
          <div className="ml-1 border-l border-[#333] pl-2 space-y-1">
            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-green-500 rounded-full" />
              Text Node · 0.1s
            </div>
            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-green-500 rounded-full" />
              Upload Image · 2.3s
            </div>
            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-green-500 rounded-full" />
              Extract Frame · 1.8s
            </div>
            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-yellow-400 rounded-full animate-pulse" />
              Run LLM · running…
            </div>
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
