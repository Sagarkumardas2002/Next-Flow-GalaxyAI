"use client";

import BaseNode from "./BaseNode";

export default function ImageNode() {
  return (
    <BaseNode title="Upload Image" icon="↑" outputs={1}>
      <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
        product-photo.jpg ✓
      </div>

      <div className="border border-dashed border-[#2a2a2a] rounded-md p-2 mt-2 text-center text-[10px] text-zinc-500">
        + Upload Image
      </div>
    </BaseNode>
  );
}
