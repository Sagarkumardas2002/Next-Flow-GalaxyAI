"use client";

import { useState } from "react";
import BaseNode from "./BaseNode";

export default function VideoNode() {
  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <>
      <BaseNode title="Upload Video" icon="▶" outputs={1}>
        {/* PREVIEW */}
        {preview ? (
          <video
            src={preview}
            onClick={() => setOpen(true)}
            className="w-full h-32 object-cover rounded-md border border-[#2a2a2a] cursor-pointer hover:opacity-80 transition"
          />
        ) : (
          <div className="border border-dashed border-[#2a2a2a] rounded-md p-4 text-center text-[10px] text-zinc-500">
            No video uploaded
          </div>
        )}

        {/* 🔥 UPGRADED UPLOAD BUTTON */}
        <label className="mt-2 block cursor-pointer border border-[#2a2a2a] rounded-md p-2 text-center text-[10px] text-zinc-300 bg-[#141414] hover:bg-[#1c1c1c] hover:border-purple-500/40 hover:text-white transition-all duration-200">
          + Upload Video
          <input
            type="file"
            accept="video/*"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </BaseNode>

      {/* 🔥 MODAL VIEW */}
      {open && preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
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

            {/* VIDEO */}
            <video
              src={preview}
              controls
              autoPlay
              className="w-[700px] max-w-[90vw] max-h-[80vh] rounded-md"
            />
          </div>
        </div>
      )}
    </>
  );
}
