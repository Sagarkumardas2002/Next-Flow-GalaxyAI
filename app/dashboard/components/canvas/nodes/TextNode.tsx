"use client";

import BaseNode from "./BaseNode";

export default function TextNode() {
  return (
    <BaseNode title="Text Node" icon="T" outputs={1}>
      <textarea
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2 py-2 text-[10px] outline-none focus:border-purple-500/40"
        defaultValue="I want to start a new businesss dont know what"
      />
    </BaseNode>
  );
}
