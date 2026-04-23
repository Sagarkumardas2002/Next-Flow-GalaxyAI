"use client";

import BaseNode from "./BaseNode";

export const nodeTypes = {
  textNode: () => (
    <BaseNode title="Text Node" icon="T" outputs={1}>
      <textarea
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2 py-2 text-[10px] outline-none focus:border-purple-500/40"
        defaultValue="I want to start a new businesss dont know what"
      />
    </BaseNode>
  ),

  imageNode: () => (
    <BaseNode title="Upload Image" icon="T" outputs={1}>
      <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
        product-photo.jpg ✓
      </div>

      <div className="border border-dashed border-[#2a2a2a] rounded-md p-2 text-center text-[10px] text-zinc-500">
        + Upload Image
      </div>
    </BaseNode>
  ),

  videoNode: () => (
    <BaseNode title="Upload Video" icon="▶" outputs={1}>
      <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
        demo-video.mp4 ✓
      </div>

      <div className="border border-dashed border-[#2a2a2a] rounded-md p-2 text-center text-[10px] text-zinc-500">
        + Upload Video
      </div>
    </BaseNode>
  ),

  cropNode: () => (
    <BaseNode title="Crop Image" icon="✂" inputs={1} outputs={1}>
      <div className="grid grid-cols-2 gap-2 text-[9px]">
        <div>
          <div className="text-zinc-500">X%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            defaultValue="10"
          />
        </div>

        <div>
          <div className="text-zinc-500">Y%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            defaultValue="10"
          />
        </div>

        <div>
          <div className="text-zinc-500">Width%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            defaultValue="80"
          />
        </div>

        <div>
          <div className="text-zinc-500">Height%</div>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1"
            defaultValue="80"
          />
        </div>
      </div>
    </BaseNode>
  ),

  extractNode: () => (
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
  ),

  llmNode: () => (
    <BaseNode title="Run LLM" icon="✦" inputs={3} outputs={1} status="running">
      <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px]">
        <option>gemini-1.5-flash</option>
      </select>

      <div className="text-[9px] text-zinc-500">
        system_prompt · user_message · images
      </div>

      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2 text-[10px] text-purple-300">
        `Introducing our premium Wireless Bluetooth Headphones...`
      </div>

      <div className="border border-purple-500/30 bg-purple-500/10 text-purple-400 text-center py-1 rounded text-[10px]">
        ✓ Done
      </div>
    </BaseNode>
  ),
};
