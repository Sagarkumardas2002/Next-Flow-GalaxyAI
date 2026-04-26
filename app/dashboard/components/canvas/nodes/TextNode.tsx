
"use client";

import { type NodeProps } from "@xyflow/react";
import { useFlowStore } from "../../../hooks/useFlowStore";
import BaseNode from "./BaseNode";

export default function TextNode({ id, data }: NodeProps) {
  const { updateNodeData } = useFlowStore();

  const text =
    (data?.text as string) ?? "I want to start a new business dont know what";

  return (
    <BaseNode title="Text Node" icon="T" outputs={1}>
      <textarea
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2 py-2 text-[10px] outline-none focus:border-purple-500/40"
        value={text}
        rows={4}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          updateNodeData(id, { text: e.target.value });
        }}
      />
    </BaseNode>
  );
}
