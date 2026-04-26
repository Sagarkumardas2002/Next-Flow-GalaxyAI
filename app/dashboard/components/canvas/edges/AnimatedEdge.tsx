"use client";

import { type EdgeProps, getBezierPath, BaseEdge } from "@xyflow/react";
import { useEffect, useState } from "react";

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [isRunning, setIsRunning] = useState(false);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  useEffect(() => {
    const onRunStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.runAll || detail?.edgeIds?.includes(id)) {
        setIsRunning(true);
      }
    };
    const onRunEnd = () => setIsRunning(false);

    window.addEventListener("workflow-run-start", onRunStart);
    window.addEventListener("workflow-run-end", onRunEnd);
    return () => {
      window.removeEventListener("workflow-run-start", onRunStart);
      window.removeEventListener("workflow-run-end", onRunEnd);
    };
  }, [id]);

  return (
    <>
      {/* Glow blur behind edge */}
      {isRunning && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(168,85,247,0.35)"
          strokeWidth={10}
          style={{ filter: "blur(5px)" }}
        />
      )}

      {/* Main edge line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isRunning ? "#a855f7" : "#3f3f46",
          strokeWidth: isRunning ? 2 : 1.5,
          transition: "stroke 0.3s",
        }}
      />

      {/* ⚡ Lightning dash */}
      {isRunning && (
        <path
          d={edgePath}
          fill="none"
          stroke="#e9d5ff"
          strokeWidth={1.5}
          strokeDasharray="6 14"
          strokeLinecap="round"
          className="edge-lightning"
        />
      )}
    </>
  );
}
