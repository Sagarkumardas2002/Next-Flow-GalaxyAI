"use client";

import { useState, useEffect, useRef } from "react";
import { useFlowStore } from "../../hooks/useFlowStore";
import { useWorkflow } from "../../hooks/useWorkflow";
import { UserButton } from "@clerk/nextjs";
import { FilePlus, Undo2, Redo2, Download, Save } from "lucide-react";

type AutoSaveStatus = "idle" | "saving" | "saved";

export default function Topbar({ displayName }: { displayName: string }) {
  const {
    undo,
    redo,
    nodes,
    edges,
    workflowName,
    setWorkflowName,
    workflowId, // "" means unsaved new workflow → auto-save is OFF
    setWorkflow, // used by New button to wipe everything including workflowId
  } = useFlowStore();

  const { saveWorkflow } = useWorkflow();
  const [isEditing, setIsEditing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");

  const isFirstRender = useRef(true);
  const prevWorkflowIdRef = useRef<string>("");

  // ─────────────────────────────────────────────────────────────
  // 🔥 AUTO-SAVE — debounced 1.5 s
  //   ONLY fires when workflowId is non-empty (i.e. already saved once manually).
  //   New workflows with workflowId="" are completely ignored here.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Skip first mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevWorkflowIdRef.current = workflowId ?? "";
      return;
    }

    // 🚫 No id = new unsaved workflow → do NOT auto-save
    if (!workflowId) return;

    // Skip on workflow switch (id changed externally)
    if (prevWorkflowIdRef.current !== workflowId) {
      prevWorkflowIdRef.current = workflowId;
      return;
    }

    setAutoSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
        const res = await saveWorkflow(workflowName);
        if (res?.id) {
          window.dispatchEvent(
            new CustomEvent("workflow-saved", { detail: res }),
          );
        }
        setAutoSaveStatus("saved");
      } catch {
        setAutoSaveStatus("idle");
      }
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, workflowName]);

  // ─────────────────────────────────────────────────────────────

  // 🔥 NEW — wipes canvas AND clears workflowId so auto-save stays off
  const handleNewWorkflow = () => {
    setWorkflow([], [], "", "Untitled Workflow"); // ← id = "" → auto-save blocked
    setAutoSaveStatus("idle");
    prevWorkflowIdRef.current = "";
  };

  // 🔥 SAVE — first manual save creates the record + arms auto-save going forward
  const handleSave = async () => {
    if (nodes.length === 0) {
      alert("Add at least one node before saving.");
      return;
    }

    try {
      // saveWorkflow in useWorkflow handles: unique name + create vs update
      const res = await saveWorkflow(workflowName);

      if (res?.id) {
        // After first save the store now has the real id — arm auto-save
        prevWorkflowIdRef.current = res.id;

        window.dispatchEvent(
          new CustomEvent("workflow-saved", { detail: res }),
        );

        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("🔴 Save error:", error);
      alert("Failed to save workflow");
    }
  };

  const handleExport = () => {
    const data = { name: workflowName, nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunSelected = () => {
    // TODO: wire up run-selected logic
  };

  const handleRunAll = () => {
    // TODO: wire up run-all logic
  };

  const iconBtn =
    "flex items-center gap-1.5 p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition text-sm cursor-pointer";

  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between z-10">
      {/* LEFT */}
      <div className="flex items-center gap-2">
        <button onClick={handleNewWorkflow} className={iconBtn}>
          <FilePlus size={15} />
          <span className="hidden sm:inline">New</span>
        </button>
        <button onClick={undo} className={iconBtn}>
          <Undo2 size={15} />
          <span className="hidden sm:inline">Undo</span>
        </button>
        <button onClick={redo} className={iconBtn}>
          <Redo2 size={15} />
          <span className="hidden sm:inline">Redo</span>
        </button>
        <button onClick={handleExport} className={iconBtn}>
          <Download size={15} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* CENTER — workflow name + auto-save badge */}
      <div className="flex items-center gap-2">
        {!isEditing ? (
          <h2
            onClick={() => setIsEditing(true)}
            className="text-white font-semibold text-lg cursor-pointer px-2 py-1 rounded hover:bg-zinc-800 transition"
          >
            {workflowName}
          </h2>
        ) : (
          <input
            autoFocus
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false);
            }}
            className="bg-zinc-900 text-white font-semibold text-lg px-2 py-1 rounded outline-none border border-zinc-700"
          />
        )}

        {/* 🔥 Auto-save status — only visible when a workflow is armed */}
        {autoSaveStatus === "saving" && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Saving…
          </span>
        )}
        {autoSaveStatus === "saved" && (
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Saved
          </span>
        )}

        {/* Unsaved indicator for new workflows */}
        {!workflowId && nodes.length > 0 && autoSaveStatus === "idle" && (
          <span className="text-[10px] text-zinc-500 italic">unsaved</span>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-semibold border border-green-500/30 transition cursor-pointer"
        >
          <Save size={14} />
          Save
        </button>

        {/* ── Run Selected ── subtle purple */}
        <button
          onClick={handleRunSelected}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-normal transition cursor-pointer"
          style={{
            background: "rgba(109, 40, 217, 0.15)",
            border: "1px solid #6d28d9",
          }}
        >
          <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
            <polygon points="0,0 10,6 0,12" fill="white" />
          </svg>
          Run Selected
        </button>

        {/* ── Run All ── solid purple + double play */}
        <button
          onClick={handleRunAll}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-normal transition cursor-pointer"
          style={{
            background: "#6d28d9",
            border: "1px solid #6d28d9",
          }}
        >
          <span className="flex gap-0.5">
            <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
              <polygon points="0,0 10,6 0,12" fill="white" />
            </svg>
            <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
              <polygon points="0,0 10,6 0,12" fill="white" />
            </svg>
          </span>
          Run All
        </button>

        <span className="text-sm text-zinc-400 hidden sm:block">
          {displayName.includes("@") ? "User" : displayName}
        </span>
        <UserButton />
      </div>
    </div>
  );
}