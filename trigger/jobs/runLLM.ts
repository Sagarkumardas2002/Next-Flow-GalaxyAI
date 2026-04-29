// // export async function POST(req: Request) {
// //   try {
// //     const { prompt, workflowId } = await req.json();

// //     console.log("🔥 Running LLM for:", workflowId);

// //     const res = await fetch(
// //       `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
// //       {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           contents: [
// //             {
// //               parts: [{ text: prompt || "Say hello" }],
// //             },
// //           ],
// //         }),
// //       },
// //     );

// //     const data = await res.json();

// //     const output =
// //       data?.candidates?.[0]?.content?.parts?.[0]?.text || "No output";

// //     console.log("🧠 Output:", output);

// //     return Response.json({
// //       success: true,
// //       output,
// //     });
// //   } catch (err) {
// //     console.error(err);

// //     return Response.json({
// //       success: false,
// //       error: String(err),
// //     });
// //   }
// // }

// import { task } from "@trigger.dev/sdk/v3";
// // ✅ FIX 1: Trimmed from 6 → 3 models (cuts redundant quota hits)
// const GEMINI_MODELS = [
//   "gemini-2.5-flash",
//   "gemini-2.0-flash",
//   "gemini-1.5-flash",
// ];

// // ─────────────────────────────────────────────────────────────
// // Fetch image and convert to base64 for Gemini vision
// // ─────────────────────────────────────────────────────────────
// async function fetchImageAsBase64(
//   url: string,
// ): Promise<{ data: string; mimeType: string }> {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);

//   const contentType = res.headers.get("content-type") ?? "image/jpeg";
//   const mimeType = contentType.split(";")[0].trim();
//   const buffer = await res.arrayBuffer();
//   const data = Buffer.from(buffer).toString("base64");

//   return { data, mimeType };
// }

// // ─────────────────────────────────────────────────────────────
// // Call Gemini — supports both text-only and vision (image) input
// // ─────────────────────────────────────────────────────────────
// async function callGemini(
//   userMessage: string,
//   systemPrompt?: string | null,
//   imageUrl?: string | null,
// ): Promise<{ output: string; model: string; fallback?: boolean }> {
//   const skipped: string[] = [];

//   // Pre-fetch image once outside the model loop
//   let imageData: { data: string; mimeType: string } | null = null;
//   if (imageUrl) {
//     try {
//       imageData = await fetchImageAsBase64(imageUrl);
//       console.log(`🖼️ Image loaded for vision: ${imageUrl.slice(0, 60)}...`);
//     } catch (err) {
//       console.warn(`⚠️ Could not load image, running text-only: ${err}`);
//     }
//   }

//   for (const model of GEMINI_MODELS) {
//     try {
//       // Build content parts — add image inline if available
//       const parts: object[] = [];

//       if (imageData) {
//         parts.push({
//           inline_data: {
//             mime_type: imageData.mimeType,
//             data: imageData.data,
//           },
//         });
//       }

//       parts.push({ text: userMessage });

//       const res = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             contents: [{ role: "user", parts }],
//             ...(systemPrompt && {
//               systemInstruction: { parts: [{ text: systemPrompt }] },
//             }),
//           }),
//         },
//       );

//       const data = await res.json();

//       if (data?.error) {
//         const type = data.error.code === 429 ? "quota" : "not_found";
//         skipped.push(`${model}(${type})`);
//         continue;
//       }

//       const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//       if (!output) {
//         skipped.push(`${model}(empty)`);
//         continue;
//       }

//       console.log(
//         skipped.length > 0
//           ? `⚡ skipped: [${skipped.join(", ")}] → ✅ ${model}`
//           : `✅ model: ${model}`,
//       );

//       return { output, model };
//     } catch {
//       skipped.push(`${model}(network)`);
//     }
//   }

//   const hasQuota = skipped.some((s) => s.includes("quota"));
//   console.log(`⚠️ all models unavailable [${skipped.join(", ")}]`);

//   return {
//     output: hasQuota
//       ? "Rate limit reached. Please wait a moment and try again."
//       : "AI models are currently unavailable. Please try again later.",
//     model: "none",
//     fallback: true,
//   };
// }

// // ─────────────────────────────────────────────────────────────
// // Trigger.dev task — handles text-only AND vision
// // ─────────────────────────────────────────────────────────────
// export const runLLMTask = task({
//   id: "run-llm",
//   maxDuration: 300,
//   retry: {
//     maxAttempts: 2,
//     minTimeoutInMs: 1000,
//     maxTimeoutInMs: 5000,
//     factor: 2,
//   },
//   run: async (payload: {
//     userMessage: string;
//     systemPrompt?: string | null;
//     imageUrl?: string | null; // from CropNode or ExtractNode
//     workflowId?: string;
//     nodeId?: string;
//   }) => {
//     const { userMessage, systemPrompt, imageUrl, workflowId, nodeId } = payload;

//     console.log(
//       `🔥 run-llm | workflow: ${workflowId ?? "?"} | node: ${nodeId ?? "?"}`,
//     );
//     console.log(`📝 user_message: ${userMessage}`);
//     console.log(`🎭 system_prompt: ${systemPrompt ?? "none"}`);
//     console.log(`🖼️ image_url: ${imageUrl ?? "none"}`);

//     if (!process.env.GEMINI_API_KEY) {
//       return {
//         success: false,
//         output: "Server misconfiguration: GEMINI_API_KEY is missing.",
//         model: "none",
//         fallback: true,
//       };
//     }

//     if (!userMessage?.trim()) {
//       return {
//         success: false,
//         output: "No message provided.",
//         model: "none",
//         fallback: true,
//       };
//     }

//     const { output, model, fallback } = await callGemini(
//       userMessage,
//       systemPrompt,
//       imageUrl,
//     );

//     return {
//       success: !fallback,
//       output,
//       model,
//       fallback: fallback ?? false,
//     };
//   },
// });

import { task } from "@trigger.dev/sdk/v3";

// ✅ Trimmed to 3 models — avoids redundant quota hits
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.split(";")[0].trim();
  const buffer = await res.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");

  return { data, mimeType };
}

async function callGemini(
  userMessage: string,
  systemPrompt?: string | null,
  imageUrl?: string | null,
): Promise<{ output: string; model: string; fallback?: boolean }> {
  const skipped: string[] = [];

  let imageData: { data: string; mimeType: string } | null = null;
  if (imageUrl) {
    try {
      imageData = await fetchImageAsBase64(imageUrl);
      console.log(`🖼️ Image loaded: ${imageUrl.slice(0, 60)}...`);
    } catch (err) {
      console.warn(`⚠️ Could not load image, running text-only: ${err}`);
    }
  }

  for (const model of GEMINI_MODELS) {
    try {
      const parts: object[] = [];

      if (imageData) {
        parts.push({
          inline_data: {
            mime_type: imageData.mimeType,
            data: imageData.data,
          },
        });
      }

      parts.push({ text: userMessage });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            ...(systemPrompt && {
              systemInstruction: { parts: [{ text: systemPrompt }] },
            }),
          }),
        },
      );

      const data = await res.json();

      if (data?.error) {
        const type = data.error.code === 429 ? "quota" : "not_found";
        skipped.push(`${model}(${type})`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!output) {
        skipped.push(`${model}(empty)`);
        continue;
      }

      console.log(
        skipped.length > 0
          ? `⚡ skipped: [${skipped.join(", ")}] → ✅ ${model}`
          : `✅ model: ${model}`,
      );

      return { output, model };
    } catch {
      skipped.push(`${model}(network)`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const hasQuota = skipped.some((s) => s.includes("quota"));
  console.log(`⚠️ all models unavailable [${skipped.join(", ")}]`);

  return {
    output: hasQuota
      ? "Rate limit reached. Please wait a moment and try again."
      : "AI models are currently unavailable. Please try again later.",
    model: "none",
    fallback: true,
  };
}

// ✅ No retry block — callGemini already handles fallback across models
export const runLLMTask = task({
  id: "run-llm",
  maxDuration: 300,
  run: async (payload: {
    userMessage: string;
    systemPrompt?: string | null;
    imageUrl?: string | null;
    workflowId?: string;
    nodeId?: string;
  }) => {
    const { userMessage, systemPrompt, imageUrl, workflowId, nodeId } = payload;

    console.log(
      `🔥 run-llm | workflow: ${workflowId ?? "?"} | node: ${nodeId ?? "?"}`,
    );
    console.log(`📝 user_message: ${userMessage}`);
    console.log(`🎭 system_prompt: ${systemPrompt ?? "none"}`);
    console.log(`🖼️ image_url: ${imageUrl ?? "none"}`);

    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        output: "Server misconfiguration: GEMINI_API_KEY is missing.",
        model: "none",
        fallback: true,
      };
    }

    if (!userMessage?.trim()) {
      return {
        success: false,
        output: "No message provided.",
        model: "none",
        fallback: true,
      };
    }

    const { output, model, fallback } = await callGemini(
      userMessage,
      systemPrompt,
      imageUrl,
    );

    return {
      success: !fallback,
      output,
      model,
      fallback: fallback ?? false,
    };
  },
});
