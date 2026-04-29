// import { task } from "@trigger.dev/sdk/v3";
// import crypto from "crypto";

// // ─────────────────────────────────────────────────────────────
// // Creates a Transloadit assembly to crop an image
// // Uses /image/resize robot with custom crop coordinates
// // ─────────────────────────────────────────────────────────────
// async function runTransloaditCrop(
//   imageUrl: string,
//   crop: { x: number; y: number; width: number; height: number },
// ): Promise<string> {
//   const key = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
//   const secret = process.env.TRANSLOADIT_SECRET!;

//   const params = {
//     auth: { key },
//     steps: {
//       ":original": {
//         robot: "/upload/handle",
//       },
//       cropped: {
//         use: ":original",
//         robot: "/image/resize",
//         resize_strategy: "crop",
//         // Transloadit crop takes absolute or relative offsets
//         // We receive percentages and convert to strategy
//         width: crop.width,
//         height: crop.height,
//         offset_x: crop.x,
//         offset_y: crop.y,
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

//   // Fetch the original image as a buffer to upload
//   const imageRes = await fetch(imageUrl);
//   if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
//   const imageBuffer = await imageRes.arrayBuffer();
//   const imageBlob = new Blob([imageBuffer]);

//   const formData = new FormData();
//   formData.append("params", fullParams);
//   formData.append("signature", signature);
//   formData.append("file", imageBlob, "image.jpg");

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

//   // Poll until assembly completes
//   const assemblyId = assembly.assembly_id;
//   let attempts = 0;

//   while (attempts < 30) {
//     await new Promise((r) => setTimeout(r, 2000));
//     attempts++;

//     const statusRes = await fetch(
//       `https://api2.transloadit.com/assemblies/${assemblyId}`,
//     );
//     const status = await statusRes.json();

//     if (status.ok === "ASSEMBLY_COMPLETED") {
//       const result = status.results?.cropped?.[0];
//       if (!result?.ssl_url && !result?.url) {
//         throw new Error("Crop completed but no output URL found");
//       }
//       return result.ssl_url ?? result.url;
//     }

//     if (status.error) {
//       throw new Error(`Assembly failed: ${status.error}`);
//     }
//   }

//   throw new Error("Transloadit assembly timed out after 60s");
// }

// // ─────────────────────────────────────────────────────────────
// // Trigger.dev task
// // ─────────────────────────────────────────────────────────────
// export const cropImageTask = task({
//   id: "crop-image",
//   maxDuration: 120,
//   retry: { maxAttempts: 2 },
//   run: async (payload: {
//     imageUrl: string;
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//     nodeId?: string;
//   }) => {
//     const { imageUrl, x, y, width, height, nodeId } = payload;

//     console.log(`✂️ crop-image task | node: ${nodeId ?? "?"}`);
//     console.log(`📐 crop: x=${x} y=${y} w=${width} h=${height}`);
//     console.log(`🖼️ source: ${imageUrl}`);

//     const croppedUrl = await runTransloaditCrop(imageUrl, {
//       x,
//       y,
//       width,
//       height,
//     });

//     console.log(`✅ cropped: ${croppedUrl}`);

//     return { success: true, croppedUrl };
//   },
// });

import { task } from "@trigger.dev/sdk/v3";
import crypto from "crypto";

async function runTransloaditCrop(
  imageUrl: string,
  crop: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const key = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
  const secret = process.env.TRANSLOADIT_SECRET!;

  // ✅ expires must be inside the auth object
  const expires = new Date(Date.now() + 30 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, "+00:00");

  const params = {
    auth: { key, expires }, // ✅ expires here, not at top level
    steps: {
      ":original": {
        robot: "/upload/handle",
      },
      cropped: {
        use: ":original",
        robot: "/image/resize",
        resize_strategy: "crop",
        width: crop.width,
        height: crop.height,
        offset_x: crop.x,
        offset_y: crop.y,
        imagemagick_stack: "v3.0.0",
      },
    },
  };

  const fullParams = JSON.stringify(params);

  const signature = `sha384:${crypto
    .createHmac("sha384", secret)
    .update(Buffer.from(fullParams, "utf-8"))
    .digest("hex")}`;

  // Fetch the original image as a buffer to upload
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
  const imageBuffer = await imageRes.arrayBuffer();
  const imageBlob = new Blob([imageBuffer]);

  const formData = new FormData();
  formData.append("params", fullParams);
  formData.append("signature", signature);
  formData.append("file", imageBlob, "image.jpg");

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

  // Poll until assembly completes
  const assemblyId = assembly.assembly_id;
  let attempts = 0;

  while (attempts < 30) {
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;

    const statusRes = await fetch(
      `https://api2.transloadit.com/assemblies/${assemblyId}`,
    );
    const status = await statusRes.json();

    if (status.ok === "ASSEMBLY_COMPLETED") {
      const result = status.results?.cropped?.[0];
      if (!result?.ssl_url && !result?.url) {
        throw new Error("Crop completed but no output URL found");
      }
      return result.ssl_url ?? result.url;
    }

    if (status.error) {
      throw new Error(`Assembly failed: ${status.error}`);
    }
  }

  throw new Error("Transloadit assembly timed out after 60s");
}

export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 120,
  retry: { maxAttempts: 2 },
  run: async (payload: {
    imageUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
    nodeId?: string;
  }) => {
    const { imageUrl, x, y, width, height, nodeId } = payload;

    console.log(`✂️ crop-image task | node: ${nodeId ?? "?"}`);
    console.log(`📐 crop: x=${x} y=${y} w=${width} h=${height}`);
    console.log(`🖼️ source: ${imageUrl}`);

    const croppedUrl = await runTransloaditCrop(imageUrl, {
      x,
      y,
      width,
      height,
    });

    console.log(`✅ cropped: ${croppedUrl}`);

    return { success: true, croppedUrl };
  },
});
