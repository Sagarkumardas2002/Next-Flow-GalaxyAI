"use client";

import BaseNode from "./BaseNode";

export default function VideoNode() {
  return (
    <BaseNode title="Upload Video" icon="▶" outputs={1}>
      <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
        demo-video.mp4 ✓
      </div>

      <div className="border border-dashed border-[#2a2a2a] rounded-md p-2 mt-2 text-center text-[10px] text-zinc-500">
        + Upload Video
      </div>
    </BaseNode>
  );
}
