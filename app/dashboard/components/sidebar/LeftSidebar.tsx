"use client";

import { useState } from "react";

const items = [
  { label: "Text", icon: "T", color: "bg-slate-800 text-blue-400" },
  { label: "Upload Image", icon: "↑", color: "bg-indigo-950 text-purple-400" },
  { label: "Upload Video", icon: "▶", color: "bg-green-950 text-green-400" },
  { label: "Run LLM", icon: "✦", color: "bg-fuchsia-950 text-pink-400" },
  { label: "Crop Image", icon: "✂", color: "bg-yellow-950 text-orange-400" },
  { label: "Extract Frame", icon: "⬡", color: "bg-teal-950 text-teal-400" },
];

export default function LeftSidebar() {
  const [search, setSearch] = useState("");

  const onDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.setData("nodeType", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-[200px] min-w-[200px] bg-[#111] border-r border-[#222] flex flex-col">
      {/* TOP BAR */}
      <div className="h-12 flex items-center px-4 border-b border-[#222]">
        <div className="text-sm font-bold tracking-tight">
          Next<span className="text-purple-500">Flow</span>
        </div>
        <span className="ml-2 text-[9px] text-zinc-500">v1.0</span>
      </div>

      {/* BODY */}
      <div className="flex-1 p-3 overflow-y-auto">
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-3 px-3 py-2 text-[11px] bg-[#0a0a0a] border border-[#222] rounded-md text-zinc-300 outline-none focus:border-purple-500/40"
        />

        {/* HEADER */}
        <div className="text-[9px] text-zinc-500 mb-2 uppercase tracking-wider">
          Quick Access
        </div>

        {/* ITEMS */}
        {filteredItems.map((item) => (
          <div
            key={item.label}
            draggable
            onDragStart={(e) => onDragStart(e, item.label)}
            className="flex items-center gap-2 px-3 py-2 mb-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-zinc-300 cursor-grab hover:bg-[#222] hover:border-[#444] hover:text-white active:cursor-grabbing transition"
          >
            {/* ICON */}
            <div
              className={`w-5 h-5 flex items-center justify-center rounded ${item.color} text-[10px]`}
            >
              {item.icon}
            </div>

            {/* LABEL */}
            <span>{item.label}</span>
          </div>
        ))}

        {/* EMPTY */}
        {filteredItems.length === 0 && (
          <p className="text-[10px] text-zinc-500 mt-3">No nodes found</p>
        )}
      </div>
    </div>
  );
}
