"use client";

import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

type FlowHistory = {
  edges: Edge[];
};

type FlowState = {
  nodes: Node[];
  edges: Edge[];

  past: FlowHistory[];
  future: FlowHistory[];

  // 🔥 NEW (hover system)
  hoveredNodeId: string | null;
  setHoveredNode: (id: string | null) => void;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  undo: () => void;
  redo: () => void;

  deleteSelected: () => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],

  // 🔥 NEW STATE
  hoveredNodeId: null,

  setHoveredNode: (id) => set({ hoveredNodeId: id }),

  // ✅ Nodes update (NO history)
  setNodes: (nodes) => {
    set({ nodes });
  },

  // ✅ Edges update (WITH history)
  setEdges: (edges) => {
    const { edges: prevEdges, past } = get();

    set({
      edges,
      past: [...past, { edges: prevEdges }],
      future: [],
    });
  },

  // ✅ UNDO (edges only)
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

  // ✅ REDO (edges only)
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

  // ✅ DELETE selected nodes + edges
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
