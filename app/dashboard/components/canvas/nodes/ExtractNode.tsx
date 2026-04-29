// "use client";

// import BaseNode from "./BaseNode";

// export default function ExtractNode() {
//   return (
//     <BaseNode
//       title="Extract Frame"
//       icon="⬡"
//       inputs={1}
//       outputs={1}
//       status="done"
//     >
//       <div className="text-[9px] text-zinc-500">Timestamp</div>

//       <input
//         className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px]"
//         defaultValue="50%"
//         onKeyDown={(e) => e.stopPropagation()}
//       />

//       <div className="text-green-400 text-[10px]">
//         ↳ frame_001.jpg extracted
//       </div>
//     </BaseNode>
//   );
// }

"use client";

import { useState } from "react";
import BaseNode from "./BaseNode";
import { useFlowStore } from "../../../hooks/useFlowStore";
import { useEdges } from "@xyflow/react";
import { type NodeProps } from "@xyflow/react";

export default function ExtractNode({ id }: NodeProps) {
  const { nodes, updateNodeData } = useFlowStore();
  const allEdges = useEdges();

  const [timestamp, setTimestamp] = useState("50%");
  const [status, setStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExtract = async () => {
    // Find connected VideoNode via incoming edge
    const incomingEdge = allEdges.find((e) => e.target === id);
    if (!incomingEdge) {
      setErrorMsg("Connect a Video Node first.");
      return;
    }

    const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
    const videoUrl = (sourceNode?.data as { videoUrl?: string })?.videoUrl;

    if (!videoUrl) {
      setErrorMsg(
        "Video Node has no uploaded video yet. Upload a video first.",
      );
      return;
    }

    setStatus("running");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/nodes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          timestamp,
          nodeId: id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFrameUrl(data.frameUrl);
        // Store frame URL in node data so LLMNode can read it
        updateNodeData(id, { frameUrl: data.frameUrl });
        setStatus("success");
        console.log(`✅ ExtractNode [${id}] frame: ${data.frameUrl}`);
      } else {
        throw new Error(data.error ?? "Extraction failed");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <BaseNode
      title="Extract Frame"
      icon="⬡"
      inputHandles={["input"]}
      outputs={1}
      status={status}
    >
      <div className="text-[9px] text-zinc-500 mb-1">
        Timestamp (e.g. 50% or 00:00:05)
      </div>
      <input
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px] mb-2"
        value={timestamp}
        onChange={(e) => setTimestamp(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="50% or 00:00:05"
      />

      {/* EXTRACT BUTTON */}
      <button
        onClick={handleExtract}
        disabled={status === "running"}
        className="w-full py-1.5 rounded text-[10px] border transition disabled:opacity-50 disabled:cursor-not-allowed
          bg-[#141414] border-[#2a2a2a] hover:border-purple-500/40 hover:bg-[#1c1c1c] text-zinc-300 hover:text-white"
      >
        {status === "running" ? "Extracting…" : "⬡ Extract Frame"}
      </button>

      {/* ERROR */}
      {errorMsg && (
        <div className="mt-1 text-[9px] text-red-400">⚠ {errorMsg}</div>
      )}

      {/* SUCCESS - show extracted frame */}
      {frameUrl && status === "success" && (
        <>
          <img
            src={frameUrl}
            alt="extracted frame"
            className="mt-2 w-full h-24 object-cover rounded border border-purple-500/30"
          />
          <div className="mt-1 text-[9px] text-green-400/70 truncate">
            ✓ frame extracted
          </div>
        </>
      )}
    </BaseNode>
  );
}