

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFlowStore } from "../../hooks/useFlowStore";
import { useWorkflow } from "../../hooks/useWorkflow";
import { UserButton } from "@clerk/nextjs";
import { FilePlus, Undo2, Redo2, Download, Save } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

type AutoSaveStatus = "idle" | "saving" | "saved";

const TEXT_NODE_TYPES = new Set(["textNode"]);
const IMAGE_NODE_TYPES = new Set(["cropNode", "imageNode", "extractNode"]);

function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const adjList = new Map(nodes.map((n) => [n.id, [] as string[]]));

  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      adjList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  const queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  const sorted: Node[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighborId of adjList.get(node.id) ?? []) {
      const newDegree = (inDegree.get(neighborId) ?? 1) - 1;
      inDegree.set(neighborId, newDegree);
      if (newDegree === 0) {
        const neighborNode = nodeMap.get(neighborId);
        if (neighborNode) queue.push(neighborNode);
      }
    }
  }

  const sortedIds = new Set(sorted.map((n) => n.id));
  for (const node of nodes) {
    if (!sortedIds.has(node.id)) sorted.push(node);
  }

  return sorted;
}

function resolveInputs(
  llmNodeId: string,
  nodes: Node[],
  edges: Edge[],
  skipVideoValidation = false,
): {
  userMessage: string;
  systemPrompt: string | null;
  imageUrl: string | null;
} {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const incoming = edges.filter(
    (e) => e.target === llmNodeId && nodeMap.has(e.source),
  );

  for (const edge of incoming) {
    const handle = edge.targetHandle;
    const src = nodeMap.get(edge.source);
    if (!handle || !src) continue;

    if (handle === "user_message" || handle === "system_prompt") {
      if (!TEXT_NODE_TYPES.has(src.type ?? "")) {
        throw `The "${handle}" handle only accepts a Text Node. You connected "${src.type}" — disconnect it.`;
      }
    }

    if (handle === "images") {
      if (!IMAGE_NODE_TYPES.has(src.type ?? "")) {
        throw `The "images" handle only accepts a Crop Image, Image, or Extract Frame Node. You connected "${src.type}".`;
      }
    }

    if (handle === "video") {
      if (src.type !== "extractNode") {
        throw `The "video" handle only accepts an Extract Frame Node. You connected "${src.type}".`;
      }
      if (!skipVideoValidation) {
        const frameUrl = (src.data as { frameUrl?: string })?.frameUrl;
        if (!frameUrl) {
          throw `Extract Frame Node has no frame yet. Run All will extract it automatically.`;
        }
      }
    }
  }

  const userEdge = incoming.find((e) => e.targetHandle === "user_message");
  const fallbackEdge = !userEdge
    ? incoming.find((e) => {
        if (e.targetHandle) return false;
        return TEXT_NODE_TYPES.has(nodeMap.get(e.source)?.type ?? "");
      })
    : undefined;

  const activeUserEdge = userEdge ?? fallbackEdge;
  if (!activeUserEdge) {
    throw "No user_message connected. Connect a Text Node to the user_message handle.";
  }

  const userNode = nodeMap.get(activeUserEdge.source);
  const userMessage = (
    (userNode?.data as { text?: string })?.text ?? ""
  ).trim();
  if (!userMessage) {
    throw "The Text Node connected to user_message is empty.";
  }

  const sysEdge = incoming.find((e) => e.targetHandle === "system_prompt");
  let systemPrompt: string | null = null;
  if (sysEdge) {
    const sysNode = nodeMap.get(sysEdge.source);
    systemPrompt =
      ((sysNode?.data as { text?: string })?.text ?? "").trim() || null;
  }

  let imageUrl: string | null = null;
  const imgEdge =
    incoming.find((e) => e.targetHandle === "images") ??
    incoming.find((e) => e.targetHandle === "video");

  if (imgEdge) {
    const imgNode = nodeMap.get(imgEdge.source);
    const data = imgNode?.data as {
      croppedUrl?: string;
      imageUrl?: string;
      frameUrl?: string;
    };

    imageUrl = data?.croppedUrl ?? data?.imageUrl ?? data?.frameUrl ?? null;

    if (!imageUrl && !skipVideoValidation) {
      const nodeType = imgNode?.type ?? "unknown";
      throw nodeType === "extractNode"
        ? `Extract Frame Node has no frame yet. Use Run All to extract automatically.`
        : `Image Node connected to "${imgEdge.targetHandle}" has no processed image yet.`;
    }
  }

  return { userMessage, systemPrompt, imageUrl };
}

async function createRun(payload: {
  workflowId: string;
  type: "full" | "selected";
  nodeCount: number;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/workflow/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, status: "running" }),
    });
    const data = await res.json();
    return data.data?.id ?? null;
  } catch {
    return null;
  }
}

async function updateRun(
  id: string,
  status: "success" | "error",
  duration: number,
) {
  try {
    await fetch("/api/workflow/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, duration }),
    });
  } catch {
    /* non-critical */
  }
}

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────
function TopbarSkeleton() {
  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between">
      <style>{`
        @keyframes shimmer-ltr {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-ltr {
          position: relative;
          overflow: hidden;
          background: #27272a;
        }
        .shimmer-ltr::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #3f3f46 50%,
            transparent 100%
          );
          animation: shimmer-ltr 1.4s ease infinite;
        }
      `}</style>

      {/* LEFT */}
      <div className="flex items-center gap-2">
        {[80, 70, 70, 80].map((w, i) => (
          <div
            key={i}
            className="shimmer-ltr h-8 rounded-md border border-zinc-800"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* CENTER */}
      <div className="flex items-center gap-3">
        <div className="shimmer-ltr h-5 w-36 rounded-md" />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <div className="shimmer-ltr h-8 w-16 rounded-md" />
        <div className="shimmer-ltr h-8 w-28 rounded-md" />
        <div className="shimmer-ltr h-8 w-20 rounded-md" />
        <div className="shimmer-ltr w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Topbar({ displayName }: { displayName: string }) {
  // ── Individual selectors — the ONLY React 19 safe way with zundo ──
  // Calling useFlowStore() bare runs the temporal middleware's hook init,
  // which reads ref.current during render and throws in React 19.
  // Individual selectors only touch the requested state slice — no middleware ref.
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const workflowName = useFlowStore((s) => s.workflowName);
  const workflowId = useFlowStore((s) => s.workflowId);
  const setWorkflowName = useFlowStore((s) => s.setWorkflowName);
  const setWorkflow = useFlowStore((s) => s.setWorkflow);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const { saveWorkflow } = useWorkflow();
  const [isEditing, setIsEditing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isFirstRender = useRef(true);
  const prevWorkflowIdRef = useRef<string>("");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

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
  }, [nodes, edges]);

  // ── LAZY UNDO / REDO ──
  // Accessing .undo() / .redo() inside getState() happens only at call time
  // (inside an event handler), never during the render phase.
  const handleUndo = useCallback(() => {
    useFlowStore.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useFlowStore.getState().redo();
  }, []);

  const getConnectedEdgeIds = (nodeId: string): string[] =>
    edges
      .filter((e) => e.target === nodeId || e.source === nodeId)
      .map((e) => e.id);

  const runVideoNode = async (
    node: Node,
    currentNodes: Node[],
  ): Promise<"success" | "error"> => {
    const videoUrl = (node.data as { videoUrl?: string })?.videoUrl;
    if (!videoUrl) {
      updateNodeData(node.id, {
        status: "error",
        output: "⚠️ No video uploaded yet. Upload a video on the node first.",
      });
      return "error";
    }
    return "success";
  };

  const runExtractNode = async (
    node: Node,
    currentNodes: Node[],
  ): Promise<"success" | "error"> => {
    const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));
    const sourceEdge = edges.find((e) => e.target === node.id);
    const sourceNode = sourceEdge ? nodeMap.get(sourceEdge.source) : undefined;
    const videoUrl = (sourceNode?.data as { videoUrl?: string })?.videoUrl;

    if (!videoUrl) {
      updateNodeData(node.id, {
        status: "error",
        output: "⚠️ No video source connected, or video not uploaded yet.",
      });
      return "error";
    }

    const timestamp = (node.data as { timestamp?: string })?.timestamp ?? "50%";
    updateNodeData(node.id, { status: "running", output: "" });

    window.dispatchEvent(
      new CustomEvent("workflow-run-start", {
        detail: { edgeIds: getConnectedEdgeIds(node.id) },
      }),
    );

    try {
      const res = await fetch("/api/nodes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, timestamp, nodeId: node.id }),
      });
      const data = await res.json();
      if (data.success && data.frameUrl) {
        updateNodeData(node.id, { frameUrl: data.frameUrl, status: "done" });
        return "success";
      } else {
        updateNodeData(node.id, {
          status: "error",
          output: `❌ Extract failed: ${data.error ?? "unknown error"}`,
        });
        return "error";
      }
    } catch (err) {
      updateNodeData(node.id, {
        status: "error",
        output: `❌ Network error: ${String(err)}`,
      });
      return "error";
    }
  };

  const runLLMNode = async (
    llmNode: Node,
    currentNodes: Node[],
    runId: string | null,
    startedAt: number,
    skipVideoValidation = false,
  ): Promise<"success" | "error"> => {
    let userMessage: string;
    let systemPrompt: string | null;
    let imageUrl: string | null;

    try {
      ({ userMessage, systemPrompt, imageUrl } = resolveInputs(
        llmNode.id,
        currentNodes,
        edges,
        skipVideoValidation,
      ));
    } catch (validationError) {
      updateNodeData(llmNode.id, {
        status: "error",
        output: `⚠️ ${validationError}`,
      });
      return "error";
    }

    window.dispatchEvent(
      new CustomEvent("workflow-run-start", {
        detail: { edgeIds: getConnectedEdgeIds(llmNode.id) },
      }),
    );

    updateNodeData(llmNode.id, { status: "running", output: "" });

    const res = await fetch("/api/workflow/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId,
        nodeId: llmNode.id,
        userMessage,
        systemPrompt,
        imageUrl,
      }),
    });

    const data = await res.json();
    const duration = Date.now() - startedAt;

    if (data.success) {
      updateNodeData(llmNode.id, {
        output: data.output,
        model: data.model,
        status: "success",
      });
      if (runId) await updateRun(runId, "success", duration);
      window.dispatchEvent(
        new CustomEvent("workflow-run-saved", {
          detail: { workflowId, runId, status: "success", duration },
        }),
      );
      return "success";
    } else {
      updateNodeData(llmNode.id, {
        output: data.output ?? `❌ Error: ${data.error}`,
        status: "error",
      });
      if (runId) await updateRun(runId, "error", duration);
      window.dispatchEvent(
        new CustomEvent("workflow-run-saved", {
          detail: { workflowId, runId, status: "error", duration },
        }),
      );
      return "error";
    }
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
    } catch (err) {
      console.error("🔴 Save error:", err);
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

  const handleRunSelected = async () => {
    let runHadError = false;
    try {
      const selectedNode = nodes.find((n) => n.selected);
      if (!selectedNode) {
        alert("⚠️ Please select a node first");
        return;
      }
      setRunningNodeId(selectedNode.id);
      const startedAt = Date.now();

      if (selectedNode.type === "extractNode") {
        const result = await runExtractNode(selectedNode, nodes);
        if (result === "error") runHadError = true;
        return;
      }

      if (selectedNode.type === "llmNode") {
        const runId = workflowId
          ? await createRun({ workflowId, type: "selected", nodeCount: 1 })
          : null;

        const extractEdge = edges.find((e) => {
          if (e.target !== selectedNode.id) return false;
          const src = nodes.find((n) => n.id === e.source);
          return src?.type === "extractNode";
        });

        if (extractEdge) {
          const extractNode = nodes.find((n) => n.id === extractEdge.source);
          if (extractNode) {
            const result = await runExtractNode(extractNode, nodes);
            if (result === "error") {
              runHadError = true;
              return;
            }
            await new Promise((r) => setTimeout(r, 100));
          }
        }

        const freshNodes = useFlowStore.getState().nodes;
        const result = await runLLMNode(
          selectedNode,
          freshNodes,
          runId,
          startedAt,
          false,
        );
        if (result === "error") runHadError = true;
        return;
      }

      const ids = edges
        .filter((e) => e.source === selectedNode.id)
        .map((e) => e.target);
      const llmNodesToRun = nodes.filter(
        (n) => ids.includes(n.id) && n.type === "llmNode",
      );
      if (!llmNodesToRun.length) {
        alert("⚠️ No LLM node connected.");
        return;
      }
      const runId = workflowId
        ? await createRun({
            workflowId,
            type: "selected",
            nodeCount: llmNodesToRun.length,
          })
        : null;
      for (const llmNode of llmNodesToRun) {
        const result = await runLLMNode(
          llmNode,
          nodes,
          runId,
          Date.now(),
          false,
        );
        if (result === "error") runHadError = true;
      }
    } catch (err) {
      console.error("❌ Run Selected:", err);
      runHadError = true;
    } finally {
      window.dispatchEvent(
        new CustomEvent("workflow-run-end", {
          detail: {
            hasNodeErrors: runHadError,
            error: runHadError ? "One or more nodes failed" : undefined,
          },
        }),
      );
      setRunningNodeId(null);
    }
  };

  const handleRunAll = async () => {
    let runHadError = false;
    try {
      const sorted = topologicalSort(nodes, edges);
      const llmNodes = sorted.filter((n) => n.type === "llmNode");

      if (!llmNodes.length) {
        alert("⚠️ No LLM nodes found in the workflow");
        return;
      }

      setRunningNodeId(sorted[0]?.id ?? llmNodes[0].id);
      const startedAt = Date.now();
      const runId = workflowId
        ? await createRun({
            workflowId,
            type: "full",
            nodeCount: sorted.length,
          })
        : null;

      for (const node of sorted) {
        const currentNodes = useFlowStore.getState().nodes;
        const freshNode = currentNodes.find((n) => n.id === node.id) ?? node;

        if (node.type === "videoNode") {
          const result = await runVideoNode(freshNode, currentNodes);
          if (result === "error") {
            runHadError = true;
            if (runId) await updateRun(runId, "error", Date.now() - startedAt);
            return;
          }
          continue;
        }

        if (node.type === "extractNode") {
          const result = await runExtractNode(freshNode, currentNodes);
          if (result === "error") {
            runHadError = true;
            if (runId) await updateRun(runId, "error", Date.now() - startedAt);
            return;
          }
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }

        if (node.type === "llmNode") {
          const latestNodes = useFlowStore.getState().nodes;
          const latestLLMNode =
            latestNodes.find((n) => n.id === node.id) ?? node;
          const result = await runLLMNode(
            latestLLMNode,
            latestNodes,
            runId,
            startedAt,
            true,
          );
          if (result === "error") runHadError = true;
          continue;
        }
      }
    } catch (err) {
      console.error("❌ Run All:", err);
      runHadError = true;
    } finally {
      window.dispatchEvent(
        new CustomEvent("workflow-run-end", {
          detail: {
            hasNodeErrors: runHadError,
            error: runHadError ? "One or more nodes failed" : undefined,
          },
        }),
      );
      setRunningNodeId(null);
    }
  };

  const isRunning = runningNodeId !== null;

  // ── SKELETON ──
  if (loading) return <TopbarSkeleton />;

  // ── REAL UI ──
  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between z-10">
      {/* LEFT */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleNewWorkflow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition text-[12px] cursor-pointer"
        >
          <FilePlus size={14} />
          <span className="hidden sm:inline">New</span>
        </button>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition text-[12px] cursor-pointer"
        >
          <Undo2 size={14} />
          <span className="hidden sm:inline">Undo</span>
        </button>
        <button
          onClick={handleRedo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition text-[12px] cursor-pointer"
        >
          <Redo2 size={14} />
          <span className="hidden sm:inline">Redo</span>
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition text-[12px] cursor-pointer"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* CENTER */}
      <div className="flex items-center gap-2.5">
        {!isEditing ? (
          <h2
            onClick={() => setIsEditing(true)}
            className="text-white font-semibold text-base cursor-pointer px-2 py-1 rounded-md hover:bg-zinc-800 transition"
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
            className="bg-zinc-900 text-white font-semibold text-base px-2 py-1 rounded-md outline-none border border-zinc-700 focus:border-purple-500/60"
          />
        )}

        <div className="flex items-center gap-1.5">
          {autoSaveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Saving…
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Saved
            </span>
          )}
          {!workflowId && nodes.length > 0 && autoSaveStatus === "idle" && (
            <span className="text-[10px] text-zinc-500 italic bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
              unsaved
            </span>
          )}
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Running…
            </span>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[12px] font-semibold border border-emerald-500/30 transition cursor-pointer"
        >
          <Save size={13} />
          Save
        </button>

        <button
          onClick={handleRunSelected}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-[12px] font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-purple-700/60 hover:border-purple-500"
          style={{ background: "rgba(109,40,217,0.15)" }}
        >
          <svg width="8" height="10" viewBox="0 0 10 12" fill="none">
            <polygon points="0,0 10,6 0,12" fill="white" />
          </svg>
          {isRunning ? "Running…" : "Run Selected"}
        </button>

        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-[12px] font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-600"
          style={{ background: "#6d28d9", border: "1px solid #7c3aed" }}
        >
          <span className="flex gap-0.5">
            <svg width="8" height="10" viewBox="0 0 10 12" fill="none">
              <polygon points="0,0 10,6 0,12" fill="white" />
            </svg>
            <svg width="8" height="10" viewBox="0 0 10 12" fill="none">
              <polygon points="0,0 10,6 0,12" fill="white" />
            </svg>
          </span>
          {isRunning ? "Running…" : "Run All"}
        </button>

        <div className="flex items-center gap-2 pl-1 border-l border-zinc-800 ml-1">
          <span className="text-[11px] text-zinc-400 hidden sm:block">
            {displayName.includes("@") ? "User" : displayName}
          </span>
          <UserButton />
        </div>
      </div>
    </div>
  );
}
