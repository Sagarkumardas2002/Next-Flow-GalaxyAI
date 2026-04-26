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
    workflowId,
    setWorkflow,
    updateNodeData,
  } = useFlowStore();

  const { saveWorkflow } = useWorkflow();
  const [isEditing, setIsEditing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  const prevWorkflowIdRef = useRef<string>("");

  // ── AUTO-SAVE ──
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevWorkflowIdRef.current = workflowId ?? "";
      return;
    }
    if (!workflowId) return;
    if (prevWorkflowIdRef.current !== workflowId) {
      prevWorkflowIdRef.current = workflowId;
      return;
    }
    setAutoSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const res = await saveWorkflow(workflowName);
        if (res?.id)
          window.dispatchEvent(
            new CustomEvent("workflow-saved", { detail: res }),
          );
        setAutoSaveStatus("saved");
      } catch {
        setAutoSaveStatus("idle");
      }
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, workflowName]);

  // ── HELPER: get prompt — returns null if not connected ──
  const getPromptForNode = (llmNodeId: string): string | null => {
    const connectedEdge = edges.find((e) => e.target === llmNodeId);
    if (!connectedEdge) return null;

    const sourceNode = nodes.find((n) => n.id === connectedEdge.source);
    if (!sourceNode) return null;

    const text = (sourceNode?.data as { text?: string })?.text;
    if (!text || text.trim() === "") return null;

    return text;
  };

  // ── HELPER: get edge IDs connected to a node ──
  const getConnectedEdgeIds = (nodeId: string): string[] =>
    edges
      .filter((e) => e.target === nodeId || e.source === nodeId)
      .map((e) => e.id);

  // ── HELPER: run a single LLM node ──
  const runLLMNode = async (llmNode: (typeof nodes)[0]): Promise<boolean> => {
    const prompt = getPromptForNode(llmNode.id);

    // 🔥 Block if not connected or empty text
    if (!prompt) {
      updateNodeData(llmNode.id, {
        status: "error",
        output:
          "⚠️ No prompt found. Please connect a Text Node to this LLM Node first.",
      });
      return false;
    }

    const edgeIds = getConnectedEdgeIds(llmNode.id);

    console.log(`🚀 Running: ${llmNode.id} | Prompt: ${prompt}`);

    // ⚡ Lightning on edges
    window.dispatchEvent(
      new CustomEvent("workflow-run-start", { detail: { edgeIds } }),
    );

    updateNodeData(llmNode.id, { status: "running", output: "" });

    const res = await fetch("/api/run-llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, nodeId: llmNode.id, prompt }),
    });

    const data = await res.json();
    console.log(`✅ Node ${llmNode.id} done:`, data);

    if (data.success) {
      updateNodeData(llmNode.id, {
        output: data.output,
        model: data.model,
        status: "success",
      });
    } else {
      updateNodeData(llmNode.id, {
        output: `❌ Error: ${data.error}`,
        status: "error",
      });
    }
    return true;
  };

  const handleNewWorkflow = () => {
    setWorkflow([], [], "", "Untitled Workflow");
    setAutoSaveStatus("idle");
    prevWorkflowIdRef.current = "";
  };

  const handleSave = async () => {
    if (nodes.length === 0) {
      alert("Add at least one node before saving.");
      return;
    }
    try {
      const res = await saveWorkflow(workflowName);
      if (res?.id) {
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

  // ── RUN SELECTED ──
  const handleRunSelected = async () => {
    try {
      const selectedNode = nodes.find((n) => n.selected);
      if (!selectedNode) {
        alert("⚠️ Please select a node first");
        return;
      }

      let llmNodesToRun: typeof nodes = [];

      if (selectedNode.type === "llmNode") {
        llmNodesToRun = [selectedNode];
      } else {
        const connectedTargetIds = edges
          .filter((e) => e.source === selectedNode.id)
          .map((e) => e.target);
        llmNodesToRun = nodes.filter(
          (n) => connectedTargetIds.includes(n.id) && n.type === "llmNode",
        );
        if (!llmNodesToRun.length) {
          alert(
            "⚠️ No LLM node connected. Draw an edge from your Text Node to an LLM Node first.",
          );
          return;
        }
      }

      setRunningNodeId(llmNodesToRun[0].id);

      for (const llmNode of llmNodesToRun) {
        await runLLMNode(llmNode);
      }
    } catch (err) {
      console.error("❌ Run Selected Error:", err);
    } finally {
      window.dispatchEvent(new CustomEvent("workflow-run-end", {}));
      setRunningNodeId(null);
    }
  };

  // ── RUN ALL ──
  const handleRunAll = async () => {
    try {
      const llmNodes = nodes.filter((n) => n.type === "llmNode");
      if (!llmNodes.length) {
        alert("⚠️ No LLM nodes found in the workflow");
        return;
      }
      setRunningNodeId(llmNodes[0].id);
      for (const llmNode of llmNodes) {
        await runLLMNode(llmNode);
      }
    } catch (err) {
      console.error("❌ Run All Error:", err);
    } finally {
      window.dispatchEvent(new CustomEvent("workflow-run-end", {}));
      setRunningNodeId(null);
    }
  };

  const iconBtn =
    "flex items-center gap-1.5 p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition text-sm cursor-pointer";
  const isRunning = runningNodeId !== null;

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

      {/* CENTER */}
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
        {!workflowId && nodes.length > 0 && autoSaveStatus === "idle" && (
          <span className="text-[10px] text-zinc-500 italic">unsaved</span>
        )}
        {isRunning && (
          <span className="flex items-center gap-1 text-[10px] text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Running…
          </span>
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
        <button
          onClick={handleRunSelected}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-normal transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "rgba(109,40,217,0.15)",
            border: "1px solid #6d28d9",
          }}
        >
          <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
            <polygon points="0,0 10,6 0,12" fill="white" />
          </svg>
          {isRunning ? "Running…" : "Run Selected"}
        </button>
        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-normal transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#6d28d9", border: "1px solid #6d28d9" }}
        >
          <span className="flex gap-0.5">
            <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
              <polygon points="0,0 10,6 0,12" fill="white" />
            </svg>
            <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
              <polygon points="0,0 10,6 0,12" fill="white" />
            </svg>
          </span>
          {isRunning ? "Running…" : "Run All"}
        </button>
        <span className="text-sm text-zinc-400 hidden sm:block">
          {displayName.includes("@") ? "User" : displayName}
        </span>
        <UserButton />
      </div>
    </div>
  );
}
