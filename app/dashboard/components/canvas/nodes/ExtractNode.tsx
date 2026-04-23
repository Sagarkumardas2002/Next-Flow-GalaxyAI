"use client";

import BaseNode from "./BaseNode";

export default function ExtractNode() {
  return (
    <BaseNode
      title="Extract Frame"
      icon="⬡"
      inputs={1}
      outputs={1}
      status="done"
    >
      <div className="text-[9px] text-zinc-500">Timestamp</div>

      <input
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px]"
        defaultValue="50%"
      />

      <div className="text-green-400 text-[10px]">
        ↳ frame_001.jpg extracted
      </div>
    </BaseNode>
  );
}
