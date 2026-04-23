"use client";

import { Handle, Position } from "@xyflow/react";

export default function BaseNode({
  title,
  icon,
  children,
  status,
  inputs = 0,
  outputs = 1,
}: {
  title: string;
  icon: string;
  children?: React.ReactNode;
  status?: "running" | "done";
  inputs?: number;
  outputs?: number;
}) {
  return (
    <div className="w-[220px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[11px] text-zinc-300 shadow-md">
      {/* HEADER */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
        <div className="w-5 h-5 flex items-center justify-center rounded bg-[#2a2a2a] text-[10px]">
          {icon}
        </div>

        <span className="text-zinc-200">{title}</span>

        {status === "running" && (
          <span className="ml-auto text-[9px] px-2 py-[2px] bg-purple-500/20 text-purple-400 rounded">
            Running...
          </span>
        )}

        {status === "done" && (
          <span className="ml-auto text-[9px] px-2 py-[2px] bg-green-500/20 text-green-400 rounded">
            Done
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="p-3">{children}</div>

      {/* LEFT HANDLES (inputs) */}
      {Array.from({ length: inputs }).map((_, i) => (
        <Handle
          key={`in-${i}`}
          type="target"
          position={Position.Left}
          style={{ top: `${30 + i * 20}%` }}
          className="!bg-purple-500 w-2 h-2"
        />
      ))}

      {/* RIGHT HANDLES (outputs) */}
      {Array.from({ length: outputs }).map((_, i) => (
        <Handle
          key={`out-${i}`}
          type="source"
          position={Position.Right}
          style={{ top: `${50}%` }}
          className="!bg-purple-500 w-2 h-2"
        />
      ))}
    </div>
  );
}
