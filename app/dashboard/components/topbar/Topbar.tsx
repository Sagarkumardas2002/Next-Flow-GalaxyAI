// "use client";
// import { useState } from "react";
// import { useFlowStore } from "../../hooks/useFlowStore";
// import { useWorkflow } from "../../hooks/useWorkflow";
// import { UserButton } from "@clerk/nextjs";
// import { FilePlus, Undo2, Redo2, Download, Save } from "lucide-react";

// export default function Topbar({ displayName }: { displayName: string }) {
//   const {
//     undo,
//     redo,
//     nodes,
//     edges,
//     setNodes,
//     setEdges,
//     workflowName,
//     setWorkflowName,
//   } = useFlowStore();
//   const { saveWorkflow } = useWorkflow();
//   const [isEditing, setIsEditing] = useState(false);

//   const handleNewWorkflow = () => {
//     setNodes([]);
//     setEdges([]);
//     setWorkflowName("Untitled Workflow");
//   };

//   const handleSave = async () => {
//     if (nodes.length === 0) {
//       alert("Add at least one node");
//       return;
//     }
//     const res = await saveWorkflow(workflowName);
//     if (res?.id) {
//       alert("Workflow saved!");
//       window.dispatchEvent(new CustomEvent("workflow-saved", { detail: res }));
//     }
//   };

//   const handleExport = () => {
//     const data = { name: workflowName, nodes, edges };
//     const blob = new Blob([JSON.stringify(data, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${workflowName}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const handleRunSelected = () => {
//     // TODO: wire up run-selected logic
//   };

//   const handleRunAll = () => {
//     // TODO: wire up run-all logic
//   };

//   const iconBtn =
//     "flex items-center gap-1.5 p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition text-sm cursor-pointer";

//   return (
//     <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between z-10">
//       {/* LEFT */}
//       <div className="flex items-center gap-2">
//         <button onClick={handleNewWorkflow} className={iconBtn}>
//           <FilePlus size={15} />
//           <span className="hidden sm:inline">New</span>
//         </button>
//         <button onClick={undo} className={iconBtn}>
//           <Undo2 size={15} />
//           <span className="hidden sm:inline">Undo</span>
//         </button>
//         <button onClick={redo} className={iconBtn}>
//           <Redo2 size={15} />
//           <span className="hidden sm:inline">Redo</span>
//         </button>
//         <button onClick={handleExport} className={iconBtn}>
//           <Download size={15} />
//           <span className="hidden sm:inline">Export</span>
//         </button>
//       </div>

//       {/* CENTER */}
//       <div className="flex items-center gap-2">
//         {!isEditing ? (
//           <h2
//             onClick={() => setIsEditing(true)}
//             className="text-white font-semibold text-lg cursor-pointer px-2 py-1 rounded hover:bg-zinc-800 transition"
//           >
//             {workflowName}
//           </h2>
//         ) : (
//           <input
//             autoFocus
//             value={workflowName}
//             onChange={(e) => setWorkflowName(e.target.value)}
//             onBlur={() => setIsEditing(false)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") setIsEditing(false);
//             }}
//             className="bg-zinc-900 text-white font-semibold text-lg px-2 py-1 rounded outline-none border border-zinc-700"
//           />
//         )}
//       </div>

//       {/* RIGHT */}
//       <div className="flex items-center gap-3">
//         <button
//           onClick={handleSave}
//           className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-semibold border border-green-500/30 transition cursor-pointer"
//         >
//           <Save size={14} />
//           Save
//         </button>

//         {/* ── Run Selected ── very subtle purple bg + same border as Run All */}
//         <button
//           onClick={handleRunSelected}
//           className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-normal transition cursor-pointer"
//           style={{
//             background: "rgba(109, 40, 217, 0.15)",
//             border: "1px solid #6d28d9",
//           }}
//         >
//           <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
//             <polygon points="0,0 10,6 0,12" fill="white" />
//           </svg>
//           Run Selected
//         </button>

//         {/* ── Run All ── solid bright purple + double play icons */}
//         <button
//           onClick={handleRunAll}
//           className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-normal transition cursor-pointer"
//           style={{
//             background: "#6d28d9",
//             border: "1px solid #6d28d9",
//           }}
//         >
//           <span className="flex gap-0.5">
//             <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
//               <polygon points="0,0 10,6 0,12" fill="white" />
//             </svg>
//             <svg width="9" height="11" viewBox="0 0 10 12" fill="none">
//               <polygon points="0,0 10,6 0,12" fill="white" />
//             </svg>
//           </span>
//           Run All
//         </button>

//         <span className="text-sm text-zinc-400 hidden sm:block">
//           {displayName.includes("@") ? "User" : displayName}
//         </span>
//         <UserButton />
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useFlowStore } from "../../hooks/useFlowStore";
import { useWorkflow } from "../../hooks/useWorkflow";
import { UserButton } from "@clerk/nextjs";
import { FilePlus, Undo2, Redo2, Download, Save } from "lucide-react";

export default function Topbar({ displayName }: { displayName: string }) {
  const {
    undo,
    redo,
    nodes,
    edges,
    setNodes,
    setEdges,
    workflowName,
    setWorkflowName,
  } = useFlowStore();

  const { saveWorkflow } = useWorkflow();
  const [isEditing, setIsEditing] = useState(false);

  const handleNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowName("Untitled Workflow");
  };

  const handleSave = async () => {
    console.log("🟡 Save clicked");

    if (nodes.length === 0) {
      alert("Add at least one node");
      return;
    }

    try {
      console.log("📦 Sending:", {
        name: workflowName,
        nodes,
        edges,
      });

      const res = await saveWorkflow(workflowName);

      console.log("🟢 Saved response (browser):", res);

      if (res?.id) {
        alert("Workflow saved!");

        window.dispatchEvent(
          new CustomEvent("workflow-saved", { detail: res }),
        );
      }
    } catch (error) {
      console.error("🔴 Save error:", error);
      alert("Failed to save workflow");
    }
  };

  const handleExport = () => {
    const data = { name: workflowName, nodes, edges };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${workflowName}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const iconBtn =
    "flex items-center gap-1.5 p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition text-sm cursor-pointer";

  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-2">
        <button onClick={handleNewWorkflow} className={iconBtn}>
          <FilePlus size={15} />
          New
        </button>

        <button onClick={undo} className={iconBtn}>
          <Undo2 size={15} />
          Undo
        </button>

        <button onClick={redo} className={iconBtn}>
          <Redo2 size={15} />
          Redo
        </button>

        <button onClick={handleExport} className={iconBtn}>
          <Download size={15} />
          Export
        </button>
      </div>

      {/* CENTER */}
      <div className="flex items-center gap-2">
        {!isEditing ? (
          <h2
            onClick={() => setIsEditing(true)}
            className="text-white font-semibold text-lg cursor-pointer px-2 py-1 rounded hover:bg-zinc-800"
          >
            {workflowName}
          </h2>
        ) : (
          <input
            autoFocus
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false);
            }}
            className="bg-zinc-900 text-white font-semibold text-lg px-2 py-1 rounded outline-none border border-zinc-700"
          />
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-semibold"
        >
          <Save size={14} />
          Save
        </button>

        <span className="text-sm text-zinc-400 hidden sm:block">
          {displayName.includes("@") ? "User" : displayName}
        </span>

        <UserButton />
      </div>
    </div>
  );
}
