

"use client";

import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

type FlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
};

type FlowState = {
  nodes: Node[];
  edges: Edge[];

  history: FlowSnapshot[];
  future: FlowSnapshot[];

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
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;

  // 🔥 NEW — write output into any node's data
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  history: [],
  future: [],

  workflowId: null,
  workflowName: "Untitled Workflow",

  setNodes: (nodes) => {
    const { nodes: currentNodes, edges, history } = get();
    set({
      nodes,
      history: [...history, { nodes: currentNodes, edges }],
      future: [],
    });
  },

  setEdges: (edges) => {
    const { nodes, edges: currentEdges, history } = get();
    set({
      edges,
      history: [...history, { nodes, edges: currentEdges }],
      future: [],
    });
  },

  setWorkflow: (nodes, edges, id, name) =>
    set({
      nodes,
      edges,
      workflowId: id,
      workflowName: name,
      history: [],
      future: [],
    }),

  clearWorkflow: () =>
    set({
      nodes: [],
      edges: [],
      workflowId: null,
      workflowName: "Untitled Workflow",
      history: [],
      future: [],
    }),

  setWorkflowName: (name) => set({ workflowName: name }),

  deleteSelected: () => {
    const { nodes, edges, history } = get();
    const newNodes = nodes.filter((n) => !n.selected);
    const newEdges = edges.filter((e) => !e.selected);
    set({
      nodes: newNodes,
      edges: newEdges,
      history: [...history, { nodes, edges }],
      future: [],
    });
  },

  // 🔥 NEW — patches data into a specific node without affecting others
  updateNodeData: (nodeId, data) => {
    const { nodes } = get();
    set({
      nodes: nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    });
  },

  undo: () => {
    const { history, nodes, edges, future } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      history: history.slice(0, -1),
      future: [...future, { nodes, edges }],
    });
  },

  redo: () => {
    const { future, nodes, edges, history } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(0, -1),
      history: [...history, { nodes, edges }],
    });
  },
}));
