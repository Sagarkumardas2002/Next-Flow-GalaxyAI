

"use client";

import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCallback } from "react";
import { useFlowStore } from "../../hooks/useFlowStore";

import type { Node, Connection, NodeChange, EdgeChange } from "@xyflow/react";

let id = 0;
const getId = () => `node_${id++}`;

export default function FlowCanvas() {
  const { nodes, edges, setFlow } = useFlowStore();

  // ✅ Drag from sidebar → canvas
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("nodeType");
      if (!type) return;

      const newNode: Node = {
        id: getId(),
        type: "default",
        position: {
          x: event.clientX - 250,
          y: event.clientY - 100,
        },
        data: { label: type },
      };

      setFlow([...nodes, newNode], edges);
    },
    [nodes, edges],
  );

  // ✅ Connect nodes
  const onConnect = (params: Connection) => {
    const newEdges = addEdge(params, edges);
    setFlow(nodes, newEdges);
  };

  // ✅ Node drag / move / select
  const onNodesChange = (changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    setFlow(updatedNodes, edges);
  };

  // ✅ Edge changes
  const onEdgesChange = (changes: EdgeChange[]) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    setFlow(nodes, updatedEdges);
  };

  // ✅ DELETE nodes (🔥 new feature)
  const onNodesDelete = (deleted: Node[]) => {
    const remainingNodes = nodes.filter(
      (node) => !deleted.some((d) => d.id === node.id),
    );

    const remainingEdges = edges.filter(
      (edge) =>
        !deleted.some((d) => d.id === edge.source || d.id === edge.target),
    );

    setFlow(remainingNodes, remainingEdges);
  };

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onConnect={onConnect}
        fitView
        nodesDraggable={true}
        elementsSelectable={true}
        deleteKeyCode="Delete"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
