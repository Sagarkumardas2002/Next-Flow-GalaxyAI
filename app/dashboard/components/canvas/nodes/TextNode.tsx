
"use client";

import { type NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { useFlowStore } from "../../../hooks/useFlowStore";
import { useNodeGlow } from "../../../hooks/useNodeGlow";
import { useState, useRef, useEffect } from "react";

export default function TextNode({ id, data }: NodeProps) {
  const { updateNodeData } = useFlowStore();
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { glowClass } = useNodeGlow(id);

  const text =
    (data?.text as string) ?? "I want to start a new business dont know what";

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, [text]);

  return (
    <div
      className={`
        relative w-[270px] rounded-xl text-[11px] text-zinc-300
        shadow-md transition-all duration-300 bg-[#1a1a1a] border
        ${isFocused ? "border-yellow-400/50 shadow-[0_0_14px_rgba(250,204,21,0.2)]" : glowClass}
      `}
    >
      {/* HEADER */}
      <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a] cursor-grab active:cursor-grabbing">
        <div className="w-5 h-5 flex items-center justify-center rounded bg-[#2a2a2a] text-[10px]">
          T
        </div>
        <span className="text-zinc-200">Text Node</span>
        <span className="ml-auto text-[9px] px-2 py-[2px] bg-zinc-700/40 text-zinc-500 rounded">
          Input
        </span>
      </div>

      {/* BODY */}
      <div className="p-3">
        <textarea
          ref={textareaRef}
          value={text}
          rows={3}
          placeholder="Type your message here..."
          className="
            nodrag w-full bg-[#0f0f0f] border border-[#2a2a2a]
            rounded-md px-2 py-2 text-[10px] outline-none resize-none
            overflow-hidden focus:border-yellow-400/40 transition-colors
            leading-relaxed text-zinc-200 placeholder-zinc-600
          "
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            updateNodeData(id, { text: e.target.value });
            autoResize();
          }}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: "50%" }}
        className="!bg-purple-500 w-2 h-2"
      />
    </div>
  );
}
