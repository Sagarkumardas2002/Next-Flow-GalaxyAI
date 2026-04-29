

"use client";

import { useState } from "react";
import BaseNode from "./BaseNode";
import { useFlowStore } from "../../../hooks/useFlowStore";
import { type NodeProps } from "@xyflow/react";
import { useNodeGlow } from "../../../hooks/useNodeGlow"; // adjust path as needed

export default function VideoNode({ id }: NodeProps) {
  const { updateNodeData } = useFlowStore();
  const { glowClass, isConnected } = useNodeGlow(id); // ← hook applied

  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
      const templateId = process.env.NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID!;

      if (!transloaditKey || !templateId) {
        throw new Error(
          "Missing NEXT_PUBLIC_TRANSLOADIT_KEY or NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID in .env.local",
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
      if (!signRes.ok) {
        throw new Error(`Sign API failed (${signRes.status}): ${rawText}`);
      }

      const { params, signature } = JSON.parse(rawText);

      const formData = new FormData();
      formData.append("params", params);
      formData.append("signature", signature);
      formData.append("file", file);

      const uploadRes = await fetch("https://api2.transloadit.com/assemblies", {
        method: "POST",
        body: formData,
      });
      const assembly = await uploadRes.json();

      if (assembly.error) throw new Error(assembly.error);

      let cdnUrl: string | null = null;
      let attempts = 0;

      while (attempts < 30 && !cdnUrl) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;

        const statusRes = await fetch(
          `https://api2.transloadit.com/assemblies/${assembly.assembly_id}`,
        );
        const status = await statusRes.json();

        if (status.ok === "ASSEMBLY_COMPLETED") {
         const allResults = (status.results ?? {}) as Record<
           string,
           { ssl_url?: string; url?: string }[]
         >;

          for (const key of Object.keys(allResults)) {
            const item = allResults[key]?.[0];
            const url = item?.ssl_url ?? item?.url ?? null;
            if (url) {
              cdnUrl = url;
              break;
            }
          }

          if (!cdnUrl) {
            const uploads: { ssl_url?: string; url?: string }[] =
              status.uploads ?? [];
            const upload = uploads[0];
            cdnUrl = upload?.ssl_url ?? upload?.url ?? null;
          }

          break;
        }

        if (status.error) throw new Error(status.error);
      }

      if (!cdnUrl) throw new Error("Upload completed but no CDN URL returned");

      setUploadedUrl(cdnUrl);
      updateNodeData(id, { videoUrl: cdnUrl, fileName: file.name });
      console.log(`✅ VideoNode [${id}] uploaded: ${cdnUrl}`);
    } catch (err) {
      setError(
        `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      console.error("❌ VideoNode upload:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <BaseNode
        title="Upload Video"
        icon="▶"
        nodeId={id}
        outputs={1}
        status={uploading ? "running" : uploadedUrl ? "success" : "idle"}
      >
        {/* PREVIEW */}
        {preview ? (
          <div className="relative">
            <video
              src={preview}
              onClick={() => setOpen(true)}
              // ← glow also applied to the video border when connected
              className={`w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-all duration-300 ${glowClass}`}
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
          <div
            // ← glow on the empty state border too
            className={`border border-dashed rounded-md p-4 text-center text-[10px] transition-all duration-300 ${
              isConnected
                ? "border-purple-500/40 text-purple-300/60"
                : "border-[#2a2a2a] text-zinc-500"
            }`}
          >
            No video uploaded
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
              ? "Replace Video"
              : "+ Upload Video"}
          <input
            type="file"
            accept="video/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </BaseNode>

      {/* MODAL */}
      {open && preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
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