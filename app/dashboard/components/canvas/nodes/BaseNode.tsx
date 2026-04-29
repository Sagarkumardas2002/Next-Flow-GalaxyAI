// "use client";

// import { Handle, Position } from "@xyflow/react";

// export default function BaseNode({
//   title,
//   icon,
//   children,
//   status,
//   data,
//   inputHandles = [],
//   outputs = 1,
// }: {
//   title: string;
//   icon: string;
//   children?: React.ReactNode;
//   status?: "idle" | "running" | "success" | "error" | "done";
//   data?: { running?: boolean };
//   inputHandles?: string[];
//   outputs?: number;
// }) {
//   const isRunning = data?.running || status === "running";

//   const borderClass = isRunning
//     ? "border-purple-500"
//     : status === "success" || status === "done"
//       ? "border-purple-500/40"
//       : status === "error"
//         ? "border-red-500/40"
//         : "border-[#2a2a2a]";

//   return (
//     <div
//       className={`
//         w-[270px] rounded-xl text-[11px] text-zinc-300 shadow-md
//         transition-all duration-500 bg-[#1a1a1a] border
//         ${borderClass}
//         ${isRunning ? "llm-node-running" : ""}
//         ${!isRunning && status === "success" ? "llm-node-success" : ""}
//       `}
//     >
//       {/* HEADER */}
//       <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a] cursor-grab active:cursor-grabbing">
//         <div
//           className={`w-5 h-5 flex items-center justify-center rounded bg-[#2a2a2a] text-[10px] ${
//             isRunning ? "animate-pulse" : ""
//           }`}
//         >
//           {icon}
//         </div>
//         <span className="text-zinc-200">{title}</span>

//         {isRunning && (
//           <span className="ml-auto text-[9px] px-2 py-[2px] bg-purple-500/20 text-purple-400 rounded animate-pulse">
//             Running…
//           </span>
//         )}
//         {!isRunning && (status === "success" || status === "done") && (
//           <span className="ml-auto text-[9px] px-2 py-[2px] bg-green-500/20 text-green-400 rounded">
//             ✓ Done
//           </span>
//         )}
//         {!isRunning && status === "error" && (
//           <span className="ml-auto text-[9px] px-2 py-[2px] bg-red-500/20 text-red-400 rounded">
//             ✗ Error
//           </span>
//         )}
//         {!isRunning && (!status || status === "idle") && (
//           <span className="ml-auto text-[9px] px-2 py-[2px] bg-zinc-700/40 text-zinc-500 rounded">
//             Idle
//           </span>
//         )}
//       </div>

//       {/* BODY */}
//       <div className="p-3">{children}</div>

//       {/* NAMED INPUT HANDLES */}
//       {inputHandles.map((handleId, i) => (
//         <Handle
//           key={handleId}
//           id={handleId}
//           type="target"
//           position={Position.Left}
//           style={{ top: `${30 + i * 20}%` }}
//           className="!bg-purple-500 w-2 h-2"
//         />
//       ))}

//       {/* OUTPUT HANDLES */}
//       {Array.from({ length: outputs }).map((_, i) => (
//         <Handle
//           key={`out-${i}`}
//           id={`output-${i}`}
//           type="source"
//           position={Position.Right}
//           style={{ top: "50%" }}
//           className="!bg-purple-500 w-2 h-2"
//         />
//       ))}
//     </div>
//   );
// }

"use client";

import { Handle, Position } from "@xyflow/react";
import { useNodeGlow } from "../../../hooks/useNodeGlow"; // adjust path

export default function BaseNode({
  nodeId,
  title,
  icon,
  children,
  status,
  data,
  inputHandles = [],
  outputs = 1,
}: {
  nodeId?: string;
  title: string;
  icon: string;
  children?: React.ReactNode;
  status?: "idle" | "running" | "success" | "error" | "done";
  data?: { running?: boolean };
  inputHandles?: string[];
  outputs?: number;
}) {
  const { glowClass, glowStyle } = useNodeGlow(nodeId ?? "");

  const isRunning = data?.running || status === "running";

  const borderClass = isRunning
    ? "border-purple-500"
    : status === "success" || status === "done"
      ? "border-purple-500/40"
      : status === "error"
        ? "border-red-500/40"
        : glowClass; // ← glow takes over when idle/no status

  return (
    <div
      style={(!isRunning && !status) || status === "idle" ? glowStyle : {}}
      className={`
        w-[270px] rounded-xl text-[11px] text-zinc-300 shadow-md
        transition-all duration-500 bg-[#1a1a1a] border
        ${borderClass}
        ${isRunning ? "llm-node-running" : ""}
        ${!isRunning && status === "success" ? "llm-node-success" : ""}
      `}
    >
      {/* HEADER */}
      <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a] cursor-grab active:cursor-grabbing">
        <div
          className={`w-5 h-5 flex items-center justify-center rounded bg-[#2a2a2a] text-[10px] ${
            isRunning ? "animate-pulse" : ""
          }`}
        >
          {icon}
        </div>
        <span className="text-zinc-200">{title}</span>

        {isRunning && (
          <span className="ml-auto text-[9px] px-2 py-[2px] bg-purple-500/20 text-purple-400 rounded animate-pulse">
            Running…
          </span>
        )}
        {!isRunning && (status === "success" || status === "done") && (
          <span className="ml-auto text-[9px] px-2 py-[2px] bg-green-500/20 text-green-400 rounded">
            ✓ Done
          </span>
        )}
        {!isRunning && status === "error" && (
          <span className="ml-auto text-[9px] px-2 py-[2px] bg-red-500/20 text-red-400 rounded">
            ✗ Error
          </span>
        )}
        {!isRunning && (!status || status === "idle") && (
          <span className="ml-auto text-[9px] px-2 py-[2px] bg-zinc-700/40 text-zinc-500 rounded">
            Idle
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="p-3">{children}</div>

      {/* NAMED INPUT HANDLES */}
      {inputHandles.map((handleId, i) => (
        <Handle
          key={handleId}
          id={handleId}
          type="target"
          position={Position.Left}
          style={{ top: `${30 + i * 20}%` }}
          className="!bg-purple-500 w-2 h-2"
        />
      ))}

      {/* OUTPUT HANDLES */}
      {Array.from({ length: outputs }).map((_, i) => (
        <Handle
          key={`out-${i}`}
          id={`output-${i}`}
          type="source"
          position={Position.Right}
          style={{ top: "50%" }}
          className="!bg-purple-500 w-2 h-2"
        />
      ))}
    </div>
  );
}
