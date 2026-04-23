"use client";

import BaseNode from "./BaseNode";

export default function CropNode() {
  return (
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
  );
}
