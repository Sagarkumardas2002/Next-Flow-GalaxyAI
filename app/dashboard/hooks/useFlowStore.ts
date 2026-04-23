"use client";

import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  past: { nodes: Node[]; edges: Edge[] }[];
  future: { nodes: Node[]; edges: Edge[] }[];

  setFlow: (nodes: Node[], edges: Edge[]) => void;
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],

  setFlow: (nodes, edges) => {
    const { past, nodes: prevNodes, edges: prevEdges } = get();

    set({
      nodes,
      edges,
      past: [...past, { nodes: prevNodes, edges: prevEdges }],
      future: [],
    });
  },

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
    });
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;

    const next = future[0];

    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      past: [...past, { nodes, edges }],
    });
  },

  deleteSelected: () => {
    const { nodes, edges, past } = get();

    const remainingNodes = nodes.filter((n) => !n.selected);
    const remainingEdges = edges.filter((e) => !e.selected);

    set({
      nodes: remainingNodes,
      edges: remainingEdges,
      past: [...past, { nodes, edges }],
      future: [],
    });
  },
}));
