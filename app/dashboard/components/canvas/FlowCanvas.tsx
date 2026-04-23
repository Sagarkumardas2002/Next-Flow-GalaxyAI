

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
            background: "rgba(15,15,15,0.85)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "18px",
            padding: "6px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.02)",
          }}
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            switch (n.type) {
              case "videoNode":
                return "#7FFFD4"; // 🌊 Aquamarine

              case "imageNode":
                return "#F5E6CA"; // 🍦 Light Vanilla

              case "extractNode":
                return "#22c55e"; // ✅ Green

              case "cropNode":
                return "#f87171"; // 🔴 Light Red

              case "llmNode":
                return "#7c3aed"; // 🟣 Purple (same)

              case "textNode":
              default:
                return "#3f3f46"; // ⚫ Default gray
            }
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
