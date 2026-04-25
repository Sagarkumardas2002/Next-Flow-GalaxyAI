
"use client";

import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

type FlowState = {
  nodes: Node[];
  edges: Edge[];

  workflowId: string | null;
  workflowName: string;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  setWorkflow: (
    nodes: Node[],
    edges: Edge[],
    id: string | null,
    name: string,
  ) => void;

  clearWorkflow: () => void;

  setWorkflowName: (name: string) => void;

  // ✅ NEW: delete selected nodes & edges
  deleteSelected: () => void;

  undo: () => void;
  redo: () => void;
};

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [],
  edges: [],

  workflowId: null,
  workflowName: "Untitled Workflow",

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setWorkflow: (nodes, edges, id, name) =>
    set({
      nodes,
      edges,
      workflowId: id,
      workflowName: name,
    }),

  clearWorkflow: () =>
    set({
      nodes: [],
      edges: [],
      workflowId: null,
      workflowName: "Untitled Workflow",
    }),

  setWorkflowName: (name) => set({ workflowName: name }),

  // 🔥 FIXED FUNCTION (THIS WAS MISSING)
  deleteSelected: () =>
    set((state) => ({
      nodes: state.nodes.filter((node) => !node.selected),
      edges: state.edges.filter((edge) => !edge.selected),
    })),

  undo: () => {},
  redo: () => {},
}));
