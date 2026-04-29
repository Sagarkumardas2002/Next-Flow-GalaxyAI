// "use client";

// import BaseNode from "./BaseNode";

// export default function CropNode() {
//   return (
//     <BaseNode title="Crop Image" icon="✂" inputs={1} outputs={1}>
//       <div className="grid grid-cols-2 gap-2 text-[9px]">
//         <div>
//           <div className="text-zinc-500">X%</div>
//           <input
//             className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
//             defaultValue="10"
//             onKeyDown={(e) => e.stopPropagation()}
//           />
//         </div>

//         <div>
//           <div className="text-zinc-500">Y%</div>
//           <input
//             className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
//             defaultValue="10"
//             onKeyDown={(e) => e.stopPropagation()}
//           />
//         </div>

//         <div>
//           <div className="text-zinc-500">Width%</div>
//           <input
//             className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
//             defaultValue="80"
//             onKeyDown={(e) => e.stopPropagation()}
//           />
//         </div>

//         <div>
//           <div className="text-zinc-500">Height%</div>
//           <input
//             className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
//             defaultValue="80"
//             onKeyDown={(e) => e.stopPropagation()}
//           />
//         </div>
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

export default function CropNode({ id }: NodeProps) {
  const { nodes, updateNodeData } = useFlowStore();
  const allEdges = useEdges();

  const [x, setX] = useState("10");
  const [y, setY] = useState("10");
  const [width, setWidth] = useState("80");
  const [height, setHeight] = useState("80");
  const [status, setStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCrop = async () => {
    // Find connected ImageNode via incoming edge
    const incomingEdge = allEdges.find((e) => e.target === id);
    if (!incomingEdge) {
      setErrorMsg("Connect an Image Node first.");
      return;
    }

    const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
    const imageUrl = (sourceNode?.data as { imageUrl?: string })?.imageUrl;

    if (!imageUrl) {
      setErrorMsg(
        "Image Node has no uploaded image yet. Upload an image first.",
      );
      return;
    }

    setStatus("running");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/nodes/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          x: Number(x),
          y: Number(y),
          width: Number(width),
          height: Number(height),
          nodeId: id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCroppedUrl(data.croppedUrl);
        // Store cropped URL in node data so LLMNode can read it
        updateNodeData(id, { croppedUrl: data.croppedUrl });
        setStatus("success");
        console.log(`✅ CropNode [${id}] cropped: ${data.croppedUrl}`);
      } else {
        throw new Error(data.error ?? "Crop failed");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <BaseNode
      title="Crop Image"
      icon="✂"
      inputHandles={["input"]}
      outputs={1}
      status={status}
    >
      <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
        <div>
          <div className="text-zinc-500">X%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            value={x}
            onChange={(e) => setX(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div>
          <div className="text-zinc-500">Y%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            value={y}
            onChange={(e) => setY(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div>
          <div className="text-zinc-500">Width%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div>
          <div className="text-zinc-500">Height%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* CROP BUTTON */}
      <button
        onClick={handleCrop}
        disabled={status === "running"}
        className="w-full py-1.5 rounded text-[10px] border transition disabled:opacity-50 disabled:cursor-not-allowed
          bg-[#141414] border-[#2a2a2a] hover:border-purple-500/40 hover:bg-[#1c1c1c] text-zinc-300 hover:text-white"
      >
        {status === "running" ? "Cropping…" : "✂ Crop Image"}
      </button>

      {/* ERROR */}
      {errorMsg && (
        <div className="mt-1 text-[9px] text-red-400">⚠ {errorMsg}</div>
      )}

      {/* SUCCESS */}
      {croppedUrl && status === "success" && (
        <>
          <img
            src={croppedUrl}
            alt="cropped"
            className="mt-2 w-full h-24 object-cover rounded border border-purple-500/30"
          />
          <div className="mt-1 text-[9px] text-green-400/70 truncate">
            ✓ {croppedUrl.slice(0, 40)}…
          </div>
        </>
      )}
    </BaseNode>
  );
}
