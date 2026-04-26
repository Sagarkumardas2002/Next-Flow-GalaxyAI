
"use client";

import { useState } from "react";
import { type NodeProps } from "@xyflow/react";
import BaseNode from "./BaseNode";

type LLMNodeData = {
  output?: string;
  model?: string;
  status?: "idle" | "running" | "success" | "error";
};

export default function LLMNode({ data }: NodeProps) {
  const { output, model, status } = (data ?? {}) as LLMNodeData;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `llm-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BaseNode
      title="Run LLM"
      icon="✦"
      inputs={3}
      outputs={1}
      status={status ?? "idle"}
    >
      {/* Model selector */}
      <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px] mb-2">
        <option>gemini-1.5-flash</option>
        <option>gemini-1.5-flash-8b</option>
        <option>gemini-2.0-flash</option>
        <option>gemini-2.5-flash</option>
      </select>

      {/* Handle labels */}
      <div className="flex flex-col gap-[3px] mb-2">
        <div className="text-[9px]">
          <span className="text-green-400">system_prompt</span>
          <span className="text-zinc-600"> — Text Node (optional)</span>
        </div>
        <div className="text-[9px]">
          <span className="text-green-400">user_message</span>
          <span className="text-zinc-600"> — Text Node (required)</span>
        </div>
        <div className="text-[9px]">
          <span className="text-green-400">images</span>
          <span className="text-zinc-600"> — Image Node (optional)</span>
        </div>
      </div>

      <div className="text-[9px] mb-2">
        <span className="text-blue-400">output</span>
        <span className="text-zinc-600"> — Text response from LLM</span>
      </div>

      <div className="border-t border-[#2a2a2a] my-2" />

      {/* ── IDLE ── */}
      {(!status || status === "idle") && (
        <div className="border border-zinc-700 bg-zinc-800/40 text-zinc-500 text-center py-1.5 rounded text-[10px]">
          Waiting to run…
        </div>
      )}

      {/* ── RUNNING ── */}
      {status === "running" && (
        <div className="border border-purple-500/50 bg-purple-500/10 text-purple-400 text-center py-2 rounded text-[10px] flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block [animation-delay:0.2s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block [animation-delay:0.4s]" />
          <span className="ml-1">Processing…</span>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {status === "success" && output && (
        <>
          {/* model badge */}
          {model && (
            <div className="text-[9px] text-purple-400/70 mb-1">🤖 {model}</div>
          )}

          {/* 🔥 Output area with copy button in top-right */}
          <div className="relative mb-2">
            {/* Copy button — top right corner */}
            <button
              onClick={handleCopy}
              title="Copy output"
              className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded text-[9px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#4ade80"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    width="9"
                    height="9"
                    mx-2
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <rect
                      x="4"
                      y="1"
                      width="7"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M1 4h2v6a1 1 0 001 1h5v1H3a2 2 0 01-2-2V4z"
                      fill="currentColor"
                    />
                  </svg>
                </>
              )}
            </button>

            {/* Scrollable output */}
            <div
              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2 pt-6 text-[10px] text-purple-300 whitespace-pre-wrap leading-relaxed"
              style={{
                height: "130px",
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: "#3f3f46 transparent",
              }}
            >
              {output}
            </div>
          </div>

          {/* Done + Export row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border border-purple-500/30 bg-purple-500/10 text-purple-400 text-center py-1 rounded text-[10px]">
              ✓ Done
            </div>
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-1 py-1 bg-green-600 hover:bg-green-500 border border-green-500 text-white rounded text-[10px] transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </>
      )}

      {/* ── ERROR ── */}
      {status === "error" && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-400 rounded p-2 text-[10px] whitespace-pre-wrap">
          {output || "❌ Something went wrong"}
        </div>
      )}
    </BaseNode>
  );
}
