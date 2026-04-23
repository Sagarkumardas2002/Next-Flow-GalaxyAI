"use client";

export default function RightSidebar() {
  return (
    <div className="w-[220px] min-w-[220px] bg-[#111] border-l border-[#222] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-[#222]">
        <span className="text-[11px] font-medium text-zinc-300">History</span>
        <span className="text-[9px] px-2 py-[2px] bg-[#222] rounded text-zinc-500">
          3 runs
        </span>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-2 border-b border-[#222]">
        <button className="text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-400">
          All Runs
        </button>
        <button className="text-[10px] px-2 py-1 rounded text-zinc-500 hover:text-zinc-300">
          This Workflow
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 p-2 overflow-y-auto">
        {/* RUN #3 (EXPANDED) */}
        <div className="mb-2 p-2 rounded-md bg-[#1a1a1a] border border-[#333] cursor-pointer">
          {/* TOP ROW */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[7px] h-[7px] rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[10px] text-zinc-200 flex-1">Run #3</span>
            <span className="text-[9px] px-1.5 py-[1px] bg-[#222] rounded text-zinc-500">
              Full
            </span>
          </div>

          {/* META */}
          <div className="text-[10px] text-zinc-500 mb-2">
            Just now · running…
          </div>

          {/* NODE BREAKDOWN */}
          <div className="ml-1 border-l border-[#333] pl-2 space-y-1">
            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-green-500 rounded-full" />
              Text Node · 0.1s
            </div>

            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-green-500 rounded-full" />
              Upload Image · 2.3s
            </div>

            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-green-500 rounded-full" />
              Extract Frame · 1.8s
            </div>

            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
              <div className="w-[5px] h-[5px] bg-yellow-400 rounded-full animate-pulse" />
              Run LLM · running…
            </div>
          </div>
        </div>

        {/* RUN #2 */}
        <div className="mb-2 p-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444] cursor-pointer transition">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[7px] h-[7px] rounded-full bg-green-500" />
            <span className="text-[10px] text-zinc-200 flex-1">Run #2</span>
            <span className="text-[9px] px-1.5 py-[1px] bg-[#222] rounded text-zinc-500">
              Partial
            </span>
          </div>

          <div className="text-[10px] text-zinc-500">
            2 min ago · 4.2s · 2 nodes
          </div>
        </div>

        {/* RUN #1 */}
        <div className="p-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444] cursor-pointer transition">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[7px] h-[7px] rounded-full bg-red-500" />
            <span className="text-[10px] text-zinc-200 flex-1">Run #1</span>
            <span className="text-[9px] px-1.5 py-[1px] bg-[#222] rounded text-zinc-500">
              Full
            </span>
          </div>

          <div className="text-[10px] text-zinc-500">
            8 min ago · failed · 1.1s
          </div>
        </div>
      </div>
    </div>
  );
}
