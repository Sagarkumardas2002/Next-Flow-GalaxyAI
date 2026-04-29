// "use client";

// import { useState } from "react";

// const items = [
//   { label: "Text", icon: "T", color: "bg-slate-800 text-blue-400" },
//   { label: "Upload Image", icon: "↑", color: "bg-indigo-950 text-purple-400" },
//   { label: "Upload Video", icon: "▶", color: "bg-green-950 text-green-400" },
//   { label: "Run LLM", icon: "✦", color: "bg-fuchsia-950 text-pink-400" },
//   { label: "Crop Image", icon: "✂", color: "bg-yellow-950 text-orange-400" },
//   { label: "Extract Frame", icon: "⬡", color: "bg-teal-950 text-teal-400" },
// ];

// export default function LeftSidebar() {
//   const [search, setSearch] = useState("");

//   const onDragStart = (event: React.DragEvent, type: string) => {
//     event.dataTransfer.setData("nodeType", type);
//     event.dataTransfer.effectAllowed = "move";
//   };

//   const filteredItems = items.filter((item) =>
//     item.label.toLowerCase().includes(search.toLowerCase()),
//   );

//   return (
//     <div className="w-[200px] min-w-[200px] bg-[#111] border-r border-[#222] flex flex-col">
//       {/* TOP BAR */}
//       <div className="h-12 flex items-center px-4 border-b border-[#222]">
//         <div className="text-sm font-bold tracking-tight">
//           Next<span className="text-purple-500">Flow</span>
//         </div>
//         <span className="ml-2 text-[9px] text-zinc-500">v1.0</span>
//       </div>

//       {/* BODY */}
//       <div className="flex-1 p-3 overflow-y-auto">
//         {/* SEARCH */}
//         <input
//           type="text"
//           placeholder="Search nodes..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="w-full mb-3 px-3 py-2 text-[11px] bg-[#0a0a0a] border border-[#222] rounded-md text-zinc-300 outline-none focus:border-purple-500/40"
//         />

//         {/* HEADER */}
//         <div className="text-[9px] text-zinc-500 mb-2 uppercase tracking-wider">
//           Quick Access
//         </div>

//         {/* ITEMS */}
//         {filteredItems.map((item) => (
//           <div
//             key={item.label}
//             draggable
//             onDragStart={(e) => onDragStart(e, item.label)}
//             className="flex items-center gap-2 px-3 py-2 mb-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-zinc-300 cursor-grab hover:bg-[#222] hover:border-[#444] hover:text-white active:cursor-grabbing transition"
//           >
//             {/* ICON */}
//             <div
//               className={`w-5 h-5 flex items-center justify-center rounded ${item.color} text-[10px]`}
//             >
//               {item.icon}
//             </div>

//             {/* LABEL */}
//             <span>{item.label}</span>
//           </div>
//         ))}

//         {/* EMPTY */}
//         {filteredItems.length === 0 && (
//           <p className="text-[10px] text-zinc-500 mt-3">No nodes found</p>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const onDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.setData("nodeType", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-[200px] min-w-[200px] bg-[#111] border-r border-[#222] flex flex-col">
      <style>{`
        @keyframes shimmer-ltr {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-ltr {
          position: relative;
          overflow: hidden;
          background: #1a1a1a;
        }
        .shimmer-ltr::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #2e2e2e 50%,
            transparent 100%
          );
          animation: shimmer-ltr 1.4s ease infinite;
        }
      `}</style>

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
        {loading ? (
          <div className="shimmer-ltr w-full mb-3 h-8 rounded-md border border-[#222]" />
        ) : (
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-3 px-3 py-2 text-[11px] bg-[#0a0a0a] border border-[#222] rounded-md text-zinc-300 outline-none focus:border-purple-500/40"
          />
        )}

        {/* HEADER */}
        {loading ? (
          <div className="shimmer-ltr w-16 h-2 rounded mb-3" />
        ) : (
          <div className="text-[9px] text-zinc-500 mb-2 uppercase tracking-wider">
            Quick Access
          </div>
        )}

        {/* ITEMS */}
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{ opacity: 1 - i * 0.12 }}
                className="shimmer-ltr flex items-center gap-2 px-3 py-2 mb-2 rounded-md border border-[#2a2a2a] h-9"
              >
                <div className="w-5 h-5 rounded bg-[#333] flex-shrink-0" />
                <div className="h-2 w-2/3 rounded-full bg-[#333]" />
              </div>
            ))
          : filteredItems.map((item) => (
              <div
                key={item.label}
                draggable
                onDragStart={(e) => onDragStart(e, item.label)}
                className="flex items-center gap-2 px-3 py-2 mb-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-zinc-300 cursor-grab hover:bg-[#222] hover:border-[#444] hover:text-white active:cursor-grabbing transition"
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center rounded ${item.color} text-[10px]`}
                >
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </div>
            ))}

        {/* EMPTY */}
        {!loading && filteredItems.length === 0 && (
          <p className="text-[10px] text-zinc-500 mt-3">No nodes found</p>
        )}
      </div>
    </div>
  );
}
