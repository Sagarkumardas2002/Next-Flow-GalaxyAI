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
  // 🔥 UNIQUE NAME GUARD
  // If "My Flow" already exists → returns "My Flow (2)", etc.
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
  //   • workflowId present  → UPDATE existing record (auto-save path)
  //   • no workflowId       → first manual Save → CREATE new record
  //                           with a guaranteed-unique name
  // ─────────────────────────────────────────────────────────────
  const saveWorkflow = async (name: string) => {
    // UPDATE path — already saved before, just patch it
    if (workflowId) {
      const res = await fetch("/api/workflow/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workflowId, name, nodes, edges }),
      });
      const data = await res.json();
      return data.data;
    }

    // CREATE path — very first save; ensure name is unique
    const uniqueName = await generateUniqueName(name);

    const res = await fetch("/api/workflow/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: uniqueName, nodes, edges }),
    });
    const data = await res.json();

    // 🔥 After creation, write the real id + finalised name back into the store
    // so every subsequent auto-save hits the UPDATE branch
    if (data.data?.id) {
      setWorkflow(nodes, edges, data.data.id, uniqueName);
      localStorage.setItem("currentWorkflowId", data.data.id);
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
    const res = await fetch("/api/workflow/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    return data.success;
  };

  // ✅ LOAD — sets canvas + persists session
  const loadWorkflow = (workflow: Workflow) => {
    setWorkflow(workflow.nodes, workflow.edges, workflow.id, workflow.name);
    localStorage.setItem("currentWorkflowId", workflow.id);
  };

  // 🔥 CLEAR — wipes canvas, resets topbar name, removes session
  const clearWorkflow = () => {
    setWorkflow([], [], "", "Untitled Workflow");
    localStorage.removeItem("currentWorkflowId");
  };

  // 🔥 RESTORE — reloads last opened workflow after refresh / re-login
  const restoreLastWorkflow = async () => {
    const savedId = localStorage.getItem("currentWorkflowId");
    if (!savedId) return;

    const workflows = await getWorkflows();
    const match = workflows.find((wf) => wf.id === savedId);

    if (match) {
      setWorkflow(match.nodes, match.edges, match.id, match.name);
    } else {
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
