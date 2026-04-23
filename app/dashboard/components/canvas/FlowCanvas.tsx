

"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect } from "react";
import { useFlowStore } from "../../hooks/useFlowStore";
import { nodeTypes } from "./nodes/nodeTypes";

import type { Node, Connection, NodeChange, EdgeChange } from "@xyflow/react";

// ✅ FIXED ID GENERATOR (NO DUPLICATES)
const getId = () =>
  `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

export default function FlowCanvas() {
  const { nodes, edges, setNodes, setEdges, deleteSelected, undo, redo } =
    useFlowStore();

  const { screenToFlowPosition } = useReactFlow();

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }

      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }

      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected, undo, redo]);

  // ✅ Map sidebar types
  const mapType = (type: string) => {
    switch (type) {
      case "Text":
        return "textNode";
      case "Upload Image":
        return "imageNode";
      case "Upload Video":
        return "videoNode";
      case "Run LLM":
        return "llmNode";
      case "Crop Image":
        return "cropNode";
      case "Extract Frame":
        return "extractNode";
      default:
        return "textNode";
    }
  };

  // ✅ Drop node (correct position)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("nodeType");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(), // 🔥 FIX HERE
        type: mapType(type),
        position,
        data: {},
      };

      setNodes([...nodes, newNode]);
    },
    [nodes, setNodes, screenToFlowPosition],
  );

  // ✅ Connect (WITH history)
  const onConnect = (params: Connection) => {
    setEdges(
      addEdge(
        {
          ...params,
          animated: true,
          style: {
            stroke: "#7c3aed",
            strokeWidth: 1.5,
            strokeDasharray: "5 4",
          },
        },
        edges,
      ),
    );
  };

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={(c: NodeChange[]) =>
          setNodes(applyNodeChanges(c, nodes))
        }
        onEdgesChange={(c: EdgeChange[]) =>
          setEdges(applyEdgeChanges(c, edges))
        }
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onConnect={onConnect}
        deleteKeyCode={null}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          style={{
            background: "rgba(80,80,80,0.55)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "4px",
            padding: "8px",
            overflow: "hidden", // 👈 this clips the inner SVG to the rounded corners
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            switch (n.type) {
              case "videoNode":
                return "#2dd4bf"; // bright teal
              case "imageNode":
                return "#f59e0b"; // bright amber
              case "extractNode":
                return "#22c55e"; // bright green
              case "cropNode":
                return "#f43f5e"; // bright rose
              case "llmNode":
                return "#a855f7"; // bright purple
              case "textNode":
              default:
                return "#94a3b8"; // slate
            }
          }}
          maskColor="rgba(148, 163, 184, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
