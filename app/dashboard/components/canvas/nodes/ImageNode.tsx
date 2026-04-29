// "use client";

// import { useState } from "react";
// import BaseNode from "./BaseNode";

// export default function ImageNode() {
//   const [preview, setPreview] = useState<string | null>(null);
//   const [open, setOpen] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

//     // ❌ WRONG TYPE
//     if (!allowedTypes.includes(file.type)) {
//       setError("Only JPG, PNG, WEBP, GIF allowed");
//       setPreview(null);
//       return;
//     }

//     // ✅ SUCCESS
//     setError(null);
//     const url = URL.createObjectURL(file);
//     setPreview(url);
//   };

//   return (
//     <>
//       <BaseNode title="Upload Image" icon="↑" outputs={1}>
//         {/* PREVIEW */}
//         {preview ? (
//           <img
//             src={preview}
//             alt="preview"
//             onClick={() => setOpen(true)}
//             className="w-full h-32 object-cover rounded-md border border-[#2a2a2a] cursor-pointer hover:opacity-80"
//           />
//         ) : (
//           <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
//             No image uploaded
//           </div>
//         )}

//         {/* ERROR MESSAGE */}
//         {error && (
//           <div className="mt-1 text-[10px] text-red-400">⚠ {error}</div>
//         )}

//         {/* UPLOAD */}
//         <label className="mt-2 block cursor-pointer border border-[#2a2a2a] rounded-md p-2 text-center text-[10px] text-zinc-300 bg-[#141414] hover:bg-[#1c1c1c] hover:border-purple-500/40 hover:text-white transition-all duration-200">
//           + Upload Image
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleUpload}
//             className="hidden"
//           />
//         </label>
//       </BaseNode>

//       {/* 🔥 MODAL VIEW */}
//       {open && preview && (
//         <div
//           className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
//           onClick={() => setOpen(false)}
//         >
//           <div
//             className="relative bg-[#111] border border-[#2a2a2a] rounded-xl p-2 shadow-2xl"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* CLOSE BUTTON */}
//             <button
//               onClick={() => setOpen(false)}
//               className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full transition"
//             >
//               ✕
//             </button>

//             {/* IMAGE */}
//             <img
//               src={preview}
//               className="w-[600px] max-w-[90vw] max-h-[80vh] object-contain rounded-md"
//             />
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// "use client";

// import { useState } from "react";
// import BaseNode from "./BaseNode";
// import { useFlowStore } from "../../../hooks/useFlowStore";
// import { type NodeProps } from "@xyflow/react";

// export default function ImageNode({ id }: NodeProps) {
//   const { updateNodeData } = useFlowStore();

//   const [preview, setPreview] = useState<string | null>(null);
//   const [open, setOpen] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

//   const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const allowedTypes = [
//       "image/jpeg",
//       "image/png",
//       "image/webp",
//       "image/gif",
//     ];
//     if (!allowedTypes.includes(file.type)) {
//       setError("Only JPG, PNG, WEBP, GIF allowed");
//       setPreview(null);
//       return;
//     }

//     // Show local preview immediately
//     setError(null);
//     setPreview(URL.createObjectURL(file));
//     setUploading(true);

//     try {
//       // ── Step 1: get signed params from server ──
//       const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
//       const templateId =
//         process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID ??
//         process.env.TRANSLOADIT_TEMPLATE_ID;

//       const paramsPayload = JSON.stringify({
//         auth: { key: transloaditKey },
//         template_id: templateId,
//       });

//       // ### Updating new signRes
//       const signRes = await fetch("/api/transloadit/sign", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ params: paramsPayload }),
//       });

//       // ✅ Read once, use for both debug and parsing
//       const rawText = await signRes.text();
//       console.log("RAW SIGN RESPONSE:", rawText);

//       if (!signRes.ok) {
//         throw new Error(`Sign API failed (${signRes.status}): ${rawText}`);
//       }

//       const { params, signature } = JSON.parse(rawText); // ✅ parse from text, not signRes.json()

//       // #Till signRes

//       // ── Step 2: upload to Transloadit ──
//       const formData = new FormData();
//       formData.append("params", params);
//       formData.append("signature", signature);
//       formData.append("file", file);

//       const uploadRes = await fetch("https://api2.transloadit.com/assemblies", {
//         method: "POST",
//         body: formData,
//       });
//       const assembly = await uploadRes.json();

//       if (assembly.error) throw new Error(assembly.error);

//       // ── Step 3: poll until complete ──
//       let cdnUrl: string | null = null;
//       let attempts = 0;

//       while (attempts < 20 && !cdnUrl) {
//         await new Promise((r) => setTimeout(r, 2000));
//         attempts++;

//         const statusRes = await fetch(
//           `https://api2.transloadit.com/assemblies/${assembly.assembly_id}`,
//         );
//         const status = await statusRes.json();

//         if (status.ok === "ASSEMBLY_COMPLETED") {
//           // Try resized/processed first, fall back to original
//           const result =
//             status.results?.["facecropped-image"]?.[0] ??
//             status.results?.["resized-image"]?.[0] ??
//             status.results?.[":original"]?.[0];

//           cdnUrl = result?.ssl_url ?? result?.url ?? null;
//           break;
//         }

//         if (status.error) throw new Error(status.error);
//       }

//       if (!cdnUrl) throw new Error("Upload completed but no CDN URL returned");

//       // ── Step 4: store CDN URL in node data ──
//       setUploadedUrl(cdnUrl);
//       updateNodeData(id, { imageUrl: cdnUrl, fileName: file.name });
//       console.log(`✅ ImageNode [${id}] uploaded: ${cdnUrl}`);
//     } catch (err) {
//       setError(
//         `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
//       );
//       console.error("❌ ImageNode upload:", err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <>
//       <BaseNode
//         title="Upload Image"
//         icon="↑"
//         outputs={1}
//         status={uploading ? "running" : uploadedUrl ? "success" : "idle"}
//       >
//         {/* PREVIEW */}
//         {preview ? (
//           <div className="relative">
//             <img
//               src={preview}
//               alt="preview"
//               onClick={() => setOpen(true)}
//               className="w-full h-32 object-cover rounded-md border border-[#2a2a2a] cursor-pointer hover:opacity-80"
//             />
//             {uploading && (
//               <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
//                 <span className="text-[10px] text-purple-300 animate-pulse">
//                   Uploading…
//                 </span>
//               </div>
//             )}
//             {uploadedUrl && !uploading && (
//               <div className="absolute bottom-1 right-1 bg-green-500/80 text-white text-[8px] px-1.5 py-0.5 rounded">
//                 ✓ CDN
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
//             No image uploaded
//           </div>
//         )}

//         {/* ERROR */}
//         {error && (
//           <div className="mt-1 text-[10px] text-red-400">⚠ {error}</div>
//         )}

//         {/* CDN URL indicator */}
//         {uploadedUrl && (
//           <div className="mt-1 text-[9px] text-green-400/70 truncate">
//             ✓ {uploadedUrl.slice(0, 40)}…
//           </div>
//         )}

//         {/* UPLOAD BUTTON */}
//         <label
//           className={`mt-2 block cursor-pointer border rounded-md p-2 text-center text-[10px] transition-all duration-200
//           ${
//             uploading
//               ? "border-purple-500/40 bg-purple-500/10 text-purple-400 cursor-not-allowed"
//               : "border-[#2a2a2a] bg-[#141414] hover:bg-[#1c1c1c] hover:border-purple-500/40 hover:text-white text-zinc-300"
//           }`}
//         >
//           {uploading
//             ? "Uploading…"
//             : uploadedUrl
//               ? "Replace Image"
//               : "+ Upload Image"}
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleUpload}
//             disabled={uploading}
//             className="hidden"
//           />
//         </label>
//       </BaseNode>

//       {/* MODAL */}
//       {open && preview && (
//         <div
//           className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
//           onClick={() => setOpen(false)}
//         >
//           <div
//             className="relative bg-[#111] border border-[#2a2a2a] rounded-xl p-2 shadow-2xl"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <button
//               onClick={() => setOpen(false)}
//               className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full transition"
//             >
//               ✕
//             </button>
//             <img
//               src={preview}
//               className="w-[600px] max-w-[90vw] max-h-[80vh] object-contain rounded-md"
//             />
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

"use client";

import { useState } from "react";
import BaseNode from "./BaseNode";
import { useFlowStore } from "../../../hooks/useFlowStore";
import { type NodeProps } from "@xyflow/react";

export default function ImageNode({ id }: NodeProps) {
  const { updateNodeData } = useFlowStore();

  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, WEBP, GIF allowed");
      setPreview(null);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // ── Step 1: get signed params from server ──
      // ✅ Use the correct env variable name (must be NEXT_PUBLIC_ for client)
      const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
      const templateId = process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID!;

      // ✅ Debug — check these in browser console
      console.log("🔑 Key (first 6):", transloaditKey?.slice(0, 6));
      console.log("📋 Template ID:", templateId);

      if (!transloaditKey || !templateId) {
        throw new Error(
          "Missing NEXT_PUBLIC_TRANSLOADIT_KEY or NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID in .env.local",
        );
      }

      const paramsPayload = JSON.stringify({
        auth: { key: transloaditKey },
        template_id: templateId,
      });

      const signRes = await fetch("/api/transloadit/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: paramsPayload }),
      });

      const rawText = await signRes.text();
      console.log("RAW SIGN RESPONSE:", rawText);

      if (!signRes.ok) {
        throw new Error(`Sign API failed (${signRes.status}): ${rawText}`);
      }

      const { params, signature } = JSON.parse(rawText);

      // ── Step 2: upload to Transloadit ──
      const formData = new FormData();
      formData.append("params", params);
      formData.append("signature", signature);
      formData.append("file", file);

      const uploadRes = await fetch("https://api2.transloadit.com/assemblies", {
        method: "POST",
        body: formData,
      });
      const assembly = await uploadRes.json();

      console.log("📦 Assembly response:", assembly);

      if (assembly.error) throw new Error(assembly.error);

      // ── Step 3: poll until complete ──
      let cdnUrl: string | null = null;
      let attempts = 0;

      while (attempts < 20 && !cdnUrl) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;

        const statusRes = await fetch(
          `https://api2.transloadit.com/assemblies/${assembly.assembly_id}`,
        );
        const status = await statusRes.json();

        console.log(`🔄 Poll attempt ${attempts}:`, status.ok);

        if (status.ok === "ASSEMBLY_COMPLETED") {
          const result =
            status.results?.["resized"]?.[0] ??
            status.results?.[":original"]?.[0];

          cdnUrl = result?.ssl_url ?? result?.url ?? null;
          break;
        }

        if (status.error) throw new Error(status.error);
      }

      if (!cdnUrl) throw new Error("Upload completed but no CDN URL returned");

      // ── Step 4: store CDN URL in node data ──
      setUploadedUrl(cdnUrl);
      updateNodeData(id, { imageUrl: cdnUrl, fileName: file.name });
      console.log(`✅ ImageNode [${id}] uploaded: ${cdnUrl}`);
    } catch (err) {
      setError(
        `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      console.error("❌ ImageNode upload:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <BaseNode
        title="Upload Image"
        icon="↑"
        outputs={1}
        status={uploading ? "running" : uploadedUrl ? "success" : "idle"}
      >
        {/* PREVIEW */}
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="preview"
              onClick={() => setOpen(true)}
              className="w-full h-32 object-cover rounded-md border border-[#2a2a2a] cursor-pointer hover:opacity-80"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                <span className="text-[10px] text-purple-300 animate-pulse">
                  Uploading…
                </span>
              </div>
            )}
            {uploadedUrl && !uploading && (
              <div className="absolute bottom-1 right-1 bg-green-500/80 text-white text-[8px] px-1.5 py-0.5 rounded">
                ✓ CDN
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
            No image uploaded
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-1 text-[10px] text-red-400">⚠ {error}</div>
        )}

        {/* CDN URL indicator */}
        {uploadedUrl && (
          <div className="mt-1 text-[9px] text-green-400/70 truncate">
            ✓ {uploadedUrl.slice(0, 40)}…
          </div>
        )}

        {/* UPLOAD BUTTON */}
        <label
          className={`mt-2 block cursor-pointer border rounded-md p-2 text-center text-[10px] transition-all duration-200
          ${
            uploading
              ? "border-purple-500/40 bg-purple-500/10 text-purple-400 cursor-not-allowed"
              : "border-[#2a2a2a] bg-[#141414] hover:bg-[#1c1c1c] hover:border-purple-500/40 hover:text-white text-zinc-300"
          }`}
        >
          {uploading
            ? "Uploading…"
            : uploadedUrl
              ? "Replace Image"
              : "+ Upload Image"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </BaseNode>

      {/* MODAL */}
      {open && preview && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-[#111] border border-[#2a2a2a] rounded-xl p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full transition"
            >
              ✕
            </button>
            <img
              src={preview}
              className="w-[600px] max-w-[90vw] max-h-[80vh] object-contain rounded-md"
            />
          </div>
        </div>
      )}
    </>
  );
}
