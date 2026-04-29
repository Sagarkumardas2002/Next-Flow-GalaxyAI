import { useEdges } from "@xyflow/react";
import { useMemo } from "react";

interface NodeGlowResult {
  /** Drop into className alongside your border utility */
  glowClass: string;
  /** Inline style alternative — use one or the other */
  glowStyle: React.CSSProperties;
  /** Raw boolean — useful for conditional rendering */
  isConnected: boolean;
}

export function useNodeGlow(nodeId: string): NodeGlowResult {
  const edges = useEdges();

  const isConnected = useMemo(
    () => edges.some((e) => e.source === nodeId || e.target === nodeId),
    [edges, nodeId],
  );

  return {
    isConnected,
    glowClass: isConnected
      ? "border-purple-500/60 shadow-[0_0_18px_rgba(168,85,247,0.35)]"
      : "border-[#2a2a2a]",
    glowStyle: isConnected
      ? { boxShadow: "0 0 18px rgba(168,85,247,0.35)" }
      : {},
  };
}
