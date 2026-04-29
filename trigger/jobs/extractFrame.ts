// import { task } from "@trigger.dev/sdk/v3";
// import crypto from "crypto";

// // ─────────────────────────────────────────────────────────────
// // Extracts a frame from a video at a given timestamp
// // Uses Transloadit /video/thumbs robot
// // ─────────────────────────────────────────────────────────────
// async function runTransloaditExtract(
//   videoUrl: string,
//   timestamp: string, // e.g. "50%" or "00:00:05"
// ): Promise<string> {
//   const key = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
//   const secret = process.env.TRANSLOADIT_SECRET!;

//   // Determine if timestamp is percentage or time
//   const isPercent = timestamp.trim().endsWith("%");
//   const offsetPercent = isPercent
//     ? Math.min(100, Math.max(0, parseFloat(timestamp)))
//     : undefined;
//   const offsetSeconds = !isPercent ? timestamp : undefined;

//   const params = {
//     auth: { key },
//     steps: {
//       ":original": {
//         robot: "/upload/handle",
//       },
//       frame: {
//         use: ":original",
//         robot: "/video/thumbs",
//         count: 1,
//         ...(offsetPercent !== undefined && { offset_percent: offsetPercent }),
//         ...(offsetSeconds !== undefined && { offset_seconds: offsetSeconds }),
//         format: "jpg",
//         width: 1280,
//         height: 720,
//         resize_strategy: "fit",
//         imagemagick_stack: "v3.0.0",
//       },
//     },
//   };

//   const expires = new Date(Date.now() + 30 * 60 * 1000)
//     .toISOString()
//     .replace("T", " ")
//     .replace(/\.\d{3}Z$/, "+00:00");

//   const fullParams = JSON.stringify({ ...params, expires });

//   const signature = `sha384:${crypto
//     .createHmac("sha384", secret)
//     .update(Buffer.from(fullParams, "utf-8"))
//     .digest("hex")}`;

//   // Fetch video buffer
//   const videoRes = await fetch(videoUrl);
//   if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoUrl}`);
//   const videoBuffer = await videoRes.arrayBuffer();
//   const videoBlob = new Blob([videoBuffer]);

//   const formData = new FormData();
//   formData.append("params", fullParams);
//   formData.append("signature", signature);
//   formData.append("file", videoBlob, "video.mp4");

//   const assemblyRes = await fetch("https://api2.transloadit.com/assemblies", {
//     method: "POST",
//     body: formData,
//   });

//   const assembly = await assemblyRes.json();

//   if (assembly.error) {
//     throw new Error(
//       `Transloadit error: ${assembly.error} — ${assembly.message}`,
//     );
//   }

//   const assemblyId = assembly.assembly_id;
//   let attempts = 0;

//   while (attempts < 60) {
//     await new Promise((r) => setTimeout(r, 2000));
//     attempts++;

//     const statusRes = await fetch(
//       `https://api2.transloadit.com/assemblies/${assemblyId}`,
//     );
//     const status = await statusRes.json();

//     if (status.ok === "ASSEMBLY_COMPLETED") {
//       const result = status.results?.frame?.[0];
//       if (!result?.ssl_url && !result?.url) {
//         throw new Error("Extract completed but no frame URL found");
//       }
//       return result.ssl_url ?? result.url;
//     }

//     if (status.error) {
//       throw new Error(`Assembly failed: ${status.error}`);
//     }
//   }

//   throw new Error("Transloadit assembly timed out after 120s");
// }

// // ─────────────────────────────────────────────────────────────
// // Trigger.dev task
// // ─────────────────────────────────────────────────────────────
// export const extractFrameTask = task({
//   id: "extract-frame",
//   maxDuration: 180,
//   retry: { maxAttempts: 2 },
//   run: async (payload: {
//     videoUrl: string;
//     timestamp: string;
//     nodeId?: string;
//   }) => {
//     const { videoUrl, timestamp, nodeId } = payload;

//     console.log(`⬡ extract-frame task | node: ${nodeId ?? "?"}`);
//     console.log(`⏱️ timestamp: ${timestamp}`);
//     console.log(`🎥 source: ${videoUrl}`);

//     const frameUrl = await runTransloaditExtract(videoUrl, timestamp);

//     console.log(`✅ frame: ${frameUrl}`);

//     return { success: true, frameUrl };
//   },
// });

import { task } from "@trigger.dev/sdk/v3";
import crypto from "crypto";

async function runTransloaditExtract(
  videoUrl: string,
  timestamp: string,
): Promise<string> {
  const key = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
  const secret = process.env.TRANSLOADIT_SECRET!;

  const isPercent = timestamp.trim().endsWith("%");
  const offsetPercent = isPercent
    ? Math.min(100, Math.max(0, parseFloat(timestamp)))
    : undefined;
  const offsetSeconds = !isPercent ? timestamp : undefined;

  // ✅ expires inside auth
  const expires = new Date(Date.now() + 30 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, "+00:00");

  const params = {
    auth: { key, expires }, // ✅ here
    steps: {
      ":original": {
        robot: "/upload/handle",
      },
      frame: {
        use: ":original",
        robot: "/video/thumbs",
        count: 1,
        ...(offsetPercent !== undefined && { offset_percent: offsetPercent }),
        ...(offsetSeconds !== undefined && { offset_seconds: offsetSeconds }),
        format: "jpg",
        width: 1280,
        height: 720,
        resize_strategy: "fit",
        imagemagick_stack: "v3.0.0",
      },
    },
  };

  const fullParams = JSON.stringify(params);

  const signature = `sha384:${crypto
    .createHmac("sha384", secret)
    .update(Buffer.from(fullParams, "utf-8"))
    .digest("hex")}`;

  // Fetch video buffer
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoUrl}`);
  const videoBuffer = await videoRes.arrayBuffer();
  const videoBlob = new Blob([videoBuffer]);

  const formData = new FormData();
  formData.append("params", fullParams);
  formData.append("signature", signature);
  formData.append("file", videoBlob, "video.mp4");

  const assemblyRes = await fetch("https://api2.transloadit.com/assemblies", {
    method: "POST",
    body: formData,
  });

  const assembly = await assemblyRes.json();

  if (assembly.error) {
    throw new Error(
      `Transloadit error: ${assembly.error} — ${assembly.message}`,
    );
  }

  const assemblyId = assembly.assembly_id;
  let attempts = 0;

  while (attempts < 60) {
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;

    const statusRes = await fetch(
      `https://api2.transloadit.com/assemblies/${assemblyId}`,
    );
    const status = await statusRes.json();

    if (status.ok === "ASSEMBLY_COMPLETED") {
      const result = status.results?.frame?.[0];
      if (!result?.ssl_url && !result?.url) {
        throw new Error("Extract completed but no frame URL found");
      }
      return result.ssl_url ?? result.url;
    }

    if (status.error) {
      throw new Error(`Assembly failed: ${status.error}`);
    }
  }

  throw new Error("Transloadit assembly timed out after 120s");
}

export const extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 180,
  retry: { maxAttempts: 2 },
  run: async (payload: {
    videoUrl: string;
    timestamp: string;
    nodeId?: string;
  }) => {
    const { videoUrl, timestamp, nodeId } = payload;

    console.log(`⬡ extract-frame task | node: ${nodeId ?? "?"}`);
    console.log(`⏱️ timestamp: ${timestamp}`);
    console.log(`🎥 source: ${videoUrl}`);

    const frameUrl = await runTransloaditExtract(videoUrl, timestamp);

    console.log(`✅ frame: ${frameUrl}`);

    return { success: true, frameUrl };
  },
});