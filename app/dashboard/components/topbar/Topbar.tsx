"use client";

import { useFlowStore } from "../../hooks/useFlowStore";
import { UserButton } from "@clerk/nextjs";

export default function Topbar({ displayName }: { displayName: string }) {
  const { undo, redo } = useFlowStore();

  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between z-10">
      {/* LEFT */}
      <div className="flex items-center gap-2">
        {/* Undo */}
        <button
          onClick={undo}
          className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
          title="Undo (Ctrl + Z)"
        >
          Undo
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
          title="Redo (Ctrl + Y)"
        >
          Redo
        </button>
      </div>

      {/* CENTER */}
      <h2 className="text-white font-semibold tracking-wide">NextFlow</h2>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400 hidden sm:block">
          {displayName}
        </span>
        <UserButton />
      </div>
    </div>
  );
}
