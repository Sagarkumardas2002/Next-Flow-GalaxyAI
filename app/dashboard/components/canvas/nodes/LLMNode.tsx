// "use client";
// import { useState } from "react";
// import { type NodeProps, useEdges } from "@xyflow/react";
// import BaseNode from "./BaseNode";
// type LLMNodeData = {
//   output?: string;
//   model?: string;
//   status?: "idle" | "running" | "success" | "error";
// };

// const LLM_INPUT_HANDLES = ["system_prompt", "user_message", "images", "video"];

// function HandleLabel({
//   handleId,
//   label,
//   connected,
//   supported = true,
// }: {
//   handleId: string;
//   label: string;
//   connected: boolean;
//   supported?: boolean;
// }) {
//   return (
//     <div className="flex items-center gap-1 flex-1 min-w-0">
//       <span
//         className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
//           connected && supported
//             ? "bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]"
//             : connected && !supported
//               ? "bg-yellow-400"
//               : "bg-zinc-600"
//         }`}
//       />
//       <span
//         className={`text-[9px] truncate transition-colors duration-300 ${
//           connected && supported
//             ? "text-green-400"
//             : connected && !supported
//               ? "text-yellow-400"
//               : "text-zinc-500"
//         }`}
//       >
//         {label}
//         {!supported && (
//           <span className="ml-1 text-[8px] text-zinc-600">(soon)</span>
//         )}
//       </span>
//       {connected && supported && (
//         <span className="text-[8px] text-green-500/70 ml-auto flex-shrink-0">
//           ✓
//         </span>
//       )}
//     </div>
//   );
// }

// export default function LLMNode({ id, data }: NodeProps) {
//   const { output, model, status } = (data ?? {}) as LLMNodeData;
//   const [copied, setCopied] = useState(false);

//   const allEdges = useEdges();
//   const incomingEdges = allEdges.filter((e) => e.target === id);

//   const isConnected = (handleId: string) =>
//     incomingEdges.some((e) => e.targetHandle === handleId);

//   const handleCopy = async () => {
//     if (!output) return;
//     await navigator.clipboard.writeText(output);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleExport = () => {
//     if (!output) return;
//     const blob = new Blob([output], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `llm-output-${Date.now()}.txt`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <BaseNode
//       title="Run LLM"
//       icon="✦"
//       inputHandles={LLM_INPUT_HANDLES}
//       outputs={1}
//       status={status ?? "idle"}
//     >
//       {/* Model selector */}
//       <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px] mb-3">
//         <option>gemini-2.5-flash</option>
//         <option>gemini-2.0-flash</option>
//         <option>gemini-1.5-flash</option>
//       </select>

//       {/* Handle labels with live dots */}
//       <div className="flex flex-col gap-1.5 mb-2">
//         <div className="flex items-center gap-2">
//           <HandleLabel
//             handleId="system_prompt"
//             label="system_prompt"
//             connected={isConnected("system_prompt")}
//             supported={true}
//           />
//           <HandleLabel
//             handleId="user_message"
//             label="user_message"
//             connected={isConnected("user_message")}
//             supported={true}
//           />
//         </div>
//         <div className="flex items-center gap-2">
//           <HandleLabel
//             handleId="images"
//             label="images"
//             connected={isConnected("images")}
//             supported={true}
//           />
//           <HandleLabel
//             handleId="video"
//             label="video"
//             connected={isConnected("video")}
//             supported={true}
//           />
//         </div>
//       </div>

//       <div className="border-t border-[#2a2a2a] my-2" />

//       {/* ── IDLE ── */}
//       {(!status || status === "idle") && (
//         <div className="border border-zinc-700 bg-zinc-800/40 text-zinc-500 text-center py-1.5 rounded text-[10px]">
//           Waiting to run…
//         </div>
//       )}

//       {/* ── RUNNING ── */}
//       {status === "running" && (
//         <div className="border border-purple-500/50 bg-purple-500/10 text-purple-400 text-center py-2 rounded text-[10px] flex items-center justify-center gap-2">
//           <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block" />
//           <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block [animation-delay:0.2s]" />
//           <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block [animation-delay:0.4s]" />
//           <span className="ml-1">Processing…</span>
//         </div>
//       )}

//       {/* ── SUCCESS ── */}
//       {status === "success" && output && (
//         <>
//           {model && model !== "none" && (
//             <div className="text-[9px] text-purple-400/70 mb-1">🤖 {model}</div>
//           )}
//           <div className="relative mb-2">
//             <button
//               onClick={handleCopy}
//               title="Copy output"
//               className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded text-[9px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
//             >
//               {copied ? (
//                 <>
//                   <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
//                     <path
//                       d="M2 6l3 3 5-5"
//                       stroke="#4ade80"
//                       strokeWidth="1.5"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     />
//                   </svg>
//                   <span className="text-green-400">Copied!</span>
//                 </>
//               ) : (
//                 <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
//                   <rect
//                     x="4"
//                     y="1"
//                     width="7"
//                     height="8"
//                     rx="1"
//                     stroke="currentColor"
//                     strokeWidth="1.2"
//                   />
//                   <path
//                     d="M1 4h2v6a1 1 0 001 1h5v1H3a2 2 0 01-2-2V4z"
//                     fill="currentColor"
//                   />
//                 </svg>
//               )}
//             </button>
//             <div
//               className="bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2 pt-6 text-[10px] text-purple-300 whitespace-pre-wrap leading-relaxed"
//               style={{
//                 height: "130px",
//                 overflowY: "auto",
//                 scrollbarWidth: "thin",
//                 scrollbarColor: "#3f3f46 transparent",
//               }}
//             >
//               {output}
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="flex-1 border border-purple-500/30 bg-purple-500/10 text-purple-400 text-center py-1 rounded text-[10px]">
//               ✓ Done
//             </div>
//             <button
//               onClick={handleExport}
//               className="flex-1 flex items-center justify-center gap-1 py-1 bg-green-600 hover:bg-green-500 border border-green-500 text-white rounded text-[10px] transition-colors cursor-pointer"
//             >
//               Save
//             </button>
//           </div>
//         </>
//       )}

//       {/* ── ERROR ── */}
//       {status === "error" && (
//         <div className="bg-red-900/20 border border-red-700/40 text-red-400 rounded p-2 text-[10px] whitespace-pre-wrap">
//           {output || "❌ Something went wrong"}
//         </div>
//       )}
//     </BaseNode>
//   );
// }

"use client";
import { useState } from "react";
import { type NodeProps, useEdges } from "@xyflow/react";
import BaseNode from "./BaseNode";

type LLMNodeData = {
  output?: string;
  model?: string;
  status?: "idle" | "running" | "success" | "error";
};

const LLM_INPUT_HANDLES = ["system_prompt", "user_message", "images", "video"];

function HandleLabel({
  handleId,
  label,
  connected,
  supported = true,
}: {
  handleId: string;
  label: string;
  connected: boolean;
  supported?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
          connected && supported
            ? "bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]"
            : connected && !supported
              ? "bg-yellow-400"
              : "bg-zinc-600"
        }`}
      />
      <span
        className={`text-[9px] truncate transition-colors duration-300 ${
          connected && supported
            ? "text-green-400"
            : connected && !supported
              ? "text-yellow-400"
              : "text-zinc-500"
        }`}
      >
        {label}
        {!supported && (
          <span className="ml-1 text-[8px] text-zinc-600">(soon)</span>
        )}
      </span>
      {connected && supported && (
        <span className="text-[8px] text-green-500/70 ml-auto flex-shrink-0">
          ✓
        </span>
      )}
    </div>
  );
}

export default function LLMNode({ id, data }: NodeProps) {
  const { output, model, status } = (data ?? {}) as LLMNodeData;
  const [copied, setCopied] = useState(false);

  // ── FIX 1: No useEffect — derive expanded state directly.
  // userCollapsed tracks if the user manually collapsed after output arrived.
  const [userCollapsed, setUserCollapsed] = useState(false);
  const isExpanded = status === "success" && !!output && !userCollapsed;

  const allEdges = useEdges();
  const incomingEdges = allEdges.filter((e) => e.target === id);

  const isConnected = (handleId: string) =>
    incomingEdges.some((e) => e.targetHandle === handleId);

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
    // ── FIX 2: Wrap in div for dynamic width — BaseNode doesn't accept style ──
    <div
      style={{
        width: isExpanded ? "840px" : undefined,
        transition: "width 0.3s ease, height 0.3s ease",
      }}
    >
      <BaseNode
        title="Run LLM"
        icon="✦"
        inputHandles={LLM_INPUT_HANDLES}
        outputs={1}
        status={status ?? "idle"}
      >
        {/* Model selector */}
        <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1 text-[10px] mb-3">
          <option>gemini-2.5-flash</option>
          <option>gemini-2.5-flash-lite</option>
          <option>gemini-1.5-flash</option>
        </select>

        {/* Handle labels with live dots */}
        <div className="flex flex-col gap-1.5 mb-2">
          <div className="flex items-center gap-2">
            <HandleLabel
              handleId="system_prompt"
              label="system_prompt"
              connected={isConnected("system_prompt")}
              supported={true}
            />
            <HandleLabel
              handleId="user_message"
              label="user_message"
              connected={isConnected("user_message")}
              supported={true}
            />
          </div>
          <div className="flex items-center gap-2">
            <HandleLabel
              handleId="images"
              label="images"
              connected={isConnected("images")}
              supported={true}
            />
            <HandleLabel
              handleId="video"
              label="video"
              connected={isConnected("video")}
              supported={true}
            />
          </div>
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
            {/* Model badge + expand/collapse toggle */}
            <div className="flex items-center justify-between mb-1">
              {model && model !== "none" ? (
                <div className="text-[9px] text-purple-400/70">🤖 {model}</div>
              ) : (
                <div />
              )}

              <button
                onClick={() => setUserCollapsed((prev) => !prev)}
                title={isExpanded ? "Collapse output" : "Expand output"}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-[9px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="mr-1"
                    >
                      <path
                        d="M2 8l4-4 4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Collapse
                  </>
                ) : (
                  <>
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="mr-1"
                    >
                      <path
                        d="M2 4l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Expand
                  </>
                )}
              </button>
            </div>

            <div className="relative mb-2">
              <button
                onClick={handleCopy}
                title="Copy output"
                className="absolute top-2 right-4 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded text-[9px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
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
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
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
                )}
              </button>

              {/* Output box: height animates with isExpanded */}
              <div
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2 pt-6 text-[10px] text-purple-300 whitespace-pre-wrap leading-relaxed transition-all duration-300"
                style={{
                  height: isExpanded ? "280px" : "60px",
                  overflowY: isExpanded ? "auto" : "hidden",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#3f3f46 transparent",
                }}
              >
                {output}
              </div>
            </div>

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
    </div>
  );
}
