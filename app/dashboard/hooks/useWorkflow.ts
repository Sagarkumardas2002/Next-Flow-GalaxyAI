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
  const { nodes, edges, setWorkflow } = useFlowStore();

  // ✅ SAVE
  const saveWorkflow = async (name: string) => {
    const res = await fetch("/api/workflow/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, nodes, edges }),
    });

    const data = await res.json();
    return data.data;
  };

  // ✅ GET
  const getWorkflows = async (): Promise<Workflow[]> => {
    const res = await fetch("/api/workflow/get");
    const data = await res.json();
    return data.data || [];
  };

  // ✅ LOAD (FIXED)
  const loadWorkflow = (workflow: Workflow) => {
    setWorkflow(
      workflow.nodes,
      workflow.edges,
      workflow.id,
      workflow.name, // 🔥 IMPORTANT
    );
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
    loadWorkflow,
    getRuns,
  };
}
