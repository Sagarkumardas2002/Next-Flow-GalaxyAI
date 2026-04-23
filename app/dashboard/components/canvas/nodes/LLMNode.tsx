"use client";

import BaseNode from "./BaseNode";

export default function LLMNode() {
  return (
    <BaseNode title="Run LLM" icon="✦" inputs={3} outputs={1} status="running">
      <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px]">
        <option>gemini-1.5-flash</option>
      </select>

      <div className="text-[9px] text-zinc-500">
        system_prompt · user_message · images
      </div>

      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded mb-2 mt-2 p-2 text-[10px] text-purple-300">
        `Introducing our premium Wireless Bluetooth Headphones...`
      </div>

      <div className="border border-purple-500/30 bg-purple-500/10 text-purple-400 text-center py-1 rounded text-[10px]">
        ✓ Done
      </div>
    </BaseNode>
  );
}
