// "use client";

// import { useState } from "react";
// import BaseNode from "./BaseNode";

// export default function ImageNode() {
//   const [preview, setPreview] = useState<string | null>(null);
//   const [open, setOpen] = useState(false);

//   const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

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
//         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
//           {/* IMAGE WRAPPER */}
//           <div
//             className="relative bg-[#111] border border-[#2a2a2a] rounded-xl p-2 shadow-2xl"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* ❌ CLOSE BUTTON (TOP RIGHT OF IMAGE) */}
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

"use client";

import { useState } from "react";
import BaseNode from "./BaseNode";

export default function ImageNode() {
  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    // ❌ WRONG TYPE
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, WEBP, GIF allowed");
      setPreview(null);
      return;
    }

    // ✅ SUCCESS
    setError(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <>
      <BaseNode title="Upload Image" icon="↑" outputs={1}>
        {/* PREVIEW */}
        {preview ? (
          <img
            src={preview}
            alt="preview"
            onClick={() => setOpen(true)}
            className="w-full h-32 object-cover rounded-md border border-[#2a2a2a] cursor-pointer hover:opacity-80"
          />
        ) : (
          <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
            No image uploaded
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-1 text-[10px] text-red-400">⚠ {error}</div>
        )}

        {/* UPLOAD */}
        <label className="mt-2 block cursor-pointer border border-[#2a2a2a] rounded-md p-2 text-center text-[10px] text-zinc-300 bg-[#141414] hover:bg-[#1c1c1c] hover:border-purple-500/40 hover:text-white transition-all duration-200">
          + Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </BaseNode>

      {/* 🔥 MODAL VIEW */}
      {open && preview && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-[#111] border border-[#2a2a2a] rounded-xl p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full transition"
            >
              ✕
            </button>

            {/* IMAGE */}
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
