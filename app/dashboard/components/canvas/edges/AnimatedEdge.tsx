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
      {/* ── ALWAYS: BaseEdge handles React Flow's hit area, selection, and deletion.
           Never remove this — without it edges lose interactivity and get dropped. ── */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isRunning ? "#a855f7" : "#a855f7",
          strokeWidth: isRunning ? 4 : 3,
          strokeDasharray: isRunning ? undefined : "8 4",
          opacity: isRunning ? 1 : 0.75,
          strokeLinecap: "round",
          transition: "stroke 0.3s, stroke-width 0.3s",
        }}
      />

      {/* ── RUNNING ONLY: visual layers on top of BaseEdge ── */}
      {isRunning && (
        <>
          {/* 1. Wide glow blur behind */}
          <path
            d={edgePath}
            fill="none"
            stroke="rgba(168,85,247,0.35)"
            strokeWidth={22}
            style={{ filter: "blur(6px)", pointerEvents: "none" }}
          />

          {/* 2. Flowing dashes — source → destination (class defined in globals.css) */}
          <path
            d={edgePath}
            fill="none"
            stroke="#e9d5ff"
            strokeWidth={3}
            strokeDasharray="8 18"
            strokeLinecap="round"
            className="edge-flow"
            style={{ pointerEvents: "none" }}
          />

          {/* 3. Traveling particle — leading dot */}
          <circle
            r={3}
            fill="#fff"
            opacity={0.9}
            style={{ pointerEvents: "none" }}
          >
            <animateMotion
              dur="1.1s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>

          {/* 4. Traveling particle — trailing dot (offset by half cycle) */}
          <circle
            r={2}
            fill="#e9d5ff"
            opacity={0.6}
            style={{ pointerEvents: "none" }}
          >
            <animateMotion
              dur="1.1s"
              begin="-0.55s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        </>
      )}
    </>
  );
}
