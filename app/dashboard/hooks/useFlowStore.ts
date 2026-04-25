

"use client";

import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

type FlowHistory = {
  edges: Edge[];
};

type FlowState = {
  nodes: Node[];
  edges: Edge[];

  // ✅ WORKFLOW STATE
  currentWorkflowId: string | null;
  workflowName: string;

  setCurrentWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;

  past: FlowHistory[];
  future: FlowHistory[];

  hoveredNodeId: string | null;
  setHoveredNode: (id: string | null) => void;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  // ✅ LOAD WORKFLOW
  setWorkflow: (
    nodes: Node[],
    edges: Edge[],
    id?: string,
    name?: string,
  ) => void;

  undo: () => void;
  redo: () => void;

  deleteSelected: () => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  // ✅ WORKFLOW STATE
  currentWorkflowId: null,
  workflowName: "Untitled Workflow",

  setCurrentWorkflowId: (id) => set({ currentWorkflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),

  past: [],
  future: [],

  hoveredNodeId: null,
  setHoveredNode: (id) => set({ hoveredNodeId: id }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => {
    const { edges: prevEdges, past } = get();

    set({
      edges,
      past: [...past, { edges: prevEdges }],
      future: [],
    });
  },

  // ✅ LOAD WORKFLOW (CRITICAL)
  setWorkflow: (nodes, edges, id, name) => {
    set({
      nodes,
      edges,
      currentWorkflowId: id || null,
      workflowName: name || "Untitled Workflow",
      past: [],
      future: [],
    });
  },

  undo: () => {
    const { past, future, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];

    set({
      edges: previous.edges,
      past: past.slice(0, -1),
      future: [{ edges }, ...future],
    });
  },

  redo: () => {
    const { future, past, edges } = get();
    if (future.length === 0) return;

    const next = future[0];

    set({
      edges: next.edges,
      future: future.slice(1),
      past: [...past, { edges }],
    });
  },

  deleteSelected: () => {
    const { nodes, edges } = get();

    const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);

    const remainingNodes = nodes.filter((n) => !n.selected);

    const remainingEdges = edges.filter(
      (e) =>
        !e.selected &&
        !selectedNodeIds.includes(e.source) &&
        !selectedNodeIds.includes(e.target),
    );

    set({
      nodes: remainingNodes,
      edges: remainingEdges,
    });
  },
}));
