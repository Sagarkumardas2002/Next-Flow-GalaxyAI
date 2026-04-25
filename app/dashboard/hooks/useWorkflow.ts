
"use client";

import { useFlowStore } from "./useFlowStore";
import type { Node, Edge } from "@xyflow/react";

export type Workflow = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type Run = {
  id: string;
  status: string;
  createdAt: string;
};

export function useWorkflow() {
  const { nodes, edges, setWorkflow, workflowId } = useFlowStore();

  // ─────────────────────────────────────────────────────────────
  // 🔥 CLEAN NODES — strips UI-only fields before sending to DB
  // ─────────────────────────────────────────────────────────────
  const cleanNodes = (rawNodes: Node[]): Node[] =>
    rawNodes.map(({ selected: _s, dragging: _d, ...rest }) => rest as Node);

  // ─────────────────────────────────────────────────────────────
  // 🔥 UNIQUE NAME GUARD
  // ─────────────────────────────────────────────────────────────
  const generateUniqueName = async (desiredName: string): Promise<string> => {
    const existing = await getWorkflows();
    const existingNames = new Set(existing.map((wf) => wf.name));

    if (!existingNames.has(desiredName)) return desiredName;

    let counter = 2;
    while (existingNames.has(`${desiredName} (${counter})`)) {
      counter++;
    }
    return `${desiredName} (${counter})`;
  };

  // ─────────────────────────────────────────────────────────────
  // ✅ SAVE
  // ─────────────────────────────────────────────────────────────
  const saveWorkflow = async (name: string) => {
    const safeNodes = cleanNodes(nodes);

    // UPDATE path
    if (workflowId) {
      const payload = { id: workflowId, name, nodes: safeNodes, edges };

      console.group(`🔄 AUTO-SAVE → UPDATE [${workflowId}]`);
      console.log("📛 Name      :", name);
      console.log("🟦 Nodes     :", safeNodes.length, safeNodes);
      console.log("🔗 Edges     :", edges.length, edges);
      console.log("📦 Full payload →", payload);
      console.groupEnd();

      const res = await fetch("/api/workflow/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        console.log(`✅ DB Updated: ${data.data?.id}`);
      } else {
        console.error("❌ Update failed:", data.error);
      }

      return data.data;
    }

    // CREATE path — very first save
    const uniqueName = await generateUniqueName(name);
    const payload = { name: uniqueName, nodes: safeNodes, edges };

    console.group(`🆕 MANUAL SAVE → CREATE`);
    console.log("📛 Name      :", uniqueName);
    console.log("🟦 Nodes     :", safeNodes.length, safeNodes);
    console.log("🔗 Edges     :", edges.length, edges);
    console.log("📦 Full payload →", payload);
    console.groupEnd();

    const res = await fetch("/api/workflow/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.data?.id) {
      console.log(`✅ DB Created: ${data.data.id} | Name: "${uniqueName}"`);
      setWorkflow(nodes, edges, data.data.id, uniqueName);
      localStorage.setItem("currentWorkflowId", data.data.id);
    } else {
      console.error("❌ Create failed:", data.error);
    }

    return data.data;
  };

  // ✅ GET
  const getWorkflows = async (): Promise<Workflow[]> => {
    const res = await fetch("/api/workflow/get");
    const data = await res.json();
    return data.data || [];
  };

  // ✅ DELETE
  const deleteWorkflow = async (id: string) => {
    console.log(`🗑 DELETE workflow: ${id}`);
    const res = await fetch("/api/workflow/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`✅ DB Deleted: ${id}`);
    } else {
      console.error("❌ Delete failed:", data.error);
    }
    return data.success;
  };

  // ✅ LOAD
  const loadWorkflow = (workflow: Workflow) => {
    console.group(`📂 LOAD workflow: "${workflow.name}" [${workflow.id}]`);
    console.log("🟦 Nodes:", workflow.nodes.length);
    console.log("🔗 Edges:", workflow.edges.length);
    console.groupEnd();
    setWorkflow(workflow.nodes, workflow.edges, workflow.id, workflow.name);
    localStorage.setItem("currentWorkflowId", workflow.id);
  };

  // 🔥 CLEAR
  const clearWorkflow = () => {
    console.log("🧹 CLEAR — canvas wiped, session removed");
    setWorkflow([], [], "", "Untitled Workflow");
    localStorage.removeItem("currentWorkflowId");
  };

  // 🔥 RESTORE
  const restoreLastWorkflow = async () => {
    const savedId = localStorage.getItem("currentWorkflowId");
    if (!savedId) {
      console.log("🔁 RESTORE — no saved session found");
      return;
    }

    console.log(`🔁 RESTORE — looking for workflow: ${savedId}`);
    const workflows = await getWorkflows();
    const match = workflows.find((wf) => wf.id === savedId);

    if (match) {
      console.log(`✅ RESTORE — found "${match.name}", loading...`);
      setWorkflow(match.nodes, match.edges, match.id, match.name);
    } else {
      console.warn("⚠️ RESTORE — workflow not found in DB, clearing stale key");
      localStorage.removeItem("currentWorkflowId");
    }
  };

  const getRuns = async (workflowId: string): Promise<Run[]> => {
    try {
      const res = await fetch(`/api/workflow/runs?workflowId=${workflowId}`);
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  };

  return {
    saveWorkflow,
    getWorkflows,
    deleteWorkflow,
    loadWorkflow,
    clearWorkflow,
    restoreLastWorkflow,
    getRuns,
  };
}
