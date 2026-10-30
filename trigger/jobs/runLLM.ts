// import { task } from "@trigger.dev/sdk/v3";

// // ✅ Trimmed to 3 models — avoids redundant quota hits
// const GEMINI_MODELS = [
//   "gemini-2.5-flash",
//   "gemini-2.0-flash",
//   "gemini-1.5-flash",
// ];

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

// async function callGemini(
//   userMessage: string,
//   systemPrompt?: string | null,
//   imageUrl?: string | null,
// ): Promise<{ output: string; model: string; fallback?: boolean }> {
//   const skipped: string[] = [];

//   let imageData: { data: string; mimeType: string } | null = null;
//   if (imageUrl) {
//     try {
//       imageData = await fetchImageAsBase64(imageUrl);
//       console.log(`🖼️ Image loaded: ${imageUrl.slice(0, 60)}...`);
//     } catch (err) {
//       console.warn(`⚠️ Could not load image, running text-only: ${err}`);
//     }
//   }

//   for (const model of GEMINI_MODELS) {
//     try {
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
//         await new Promise((r) => setTimeout(r, 500));
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
//       await new Promise((r) => setTimeout(r, 500));
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

// // ✅ No retry block — callGemini already handles fallback across models
// export const runLLMTask = task({
//   id: "run-llm",
//   maxDuration: 300,
//   run: async (payload: {
//     userMessage: string;
//     systemPrompt?: string | null;
//     imageUrl?: string | null;
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

// ─────────────────────────────────────────────────────────────
// Model chains
//  - Text only  → Groq first (fast + free), Gemini as fallback
//  - With image → Gemini only (the Groq models here are text-only)
// Verified against GET https://api.groq.com/openai/v1/models
// ─────────────────────────────────────────────────────────────
type Provider = "groq" | "gemini";
type Step = { provider: Provider; model: string };

const TEXT_CHAIN: Step[] = [
  { provider: "groq", model: "openai/gpt-oss-120b" },
  { provider: "groq", model: "openai/gpt-oss-20b" },
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "gemini", model: "gemini-2.5-flash-lite" },
];

const VISION_CHAIN: Step[] = [
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "gemini", model: "gemini-2.5-flash-lite" },
];

const label = (s: Step) => `${s.provider}:${s.model}`;

function buildChain(
  selectedModel: string | null | undefined,
  hasImage: boolean,
): Step[] {
  const base = hasImage ? VISION_CHAIN : TEXT_CHAIN;

  // "default" / empty → use the base chain as-is (Groq first for text)
  if (!selectedModel || selectedModel === "default") return base;

  const provider: Provider = selectedModel.startsWith("gemini")
    ? "gemini"
    : "groq";

  // A text-only Groq model can't handle an image → ignore the selection
  if (hasImage && provider === "groq") return base;

  const chosen: Step = { provider, model: selectedModel };
  // Put the user's choice first, then the rest as fallback (no duplicates)
  return [chosen, ...base.filter((s) => label(s) !== label(chosen))];
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function classify(status: number): "quota" | "not_found" | "other" {
  if (status === 429) return "quota";
  if (status === 404) return "not_found";
  return "other";
}

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const mimeType = (res.headers.get("content-type") ?? "image/jpeg")
    .split(";")[0]
    .trim();
  const data = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { data, mimeType };
}

// ─────────────────────────────────────────────────────────────
// Provider calls — each returns text, or throws { status, message }
// ─────────────────────────────────────────────────────────────
class ProviderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callGroq(
  model: string,
  userMessage: string,
  systemPrompt?: string | null,
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: userMessage },
      ],
      // gpt-oss models spend part of the budget on reasoning → keep it generous
      max_completion_tokens: 2048,
      reasoning_effort: "low", // faster answers; valid for gpt-oss models
    }),
  });

  const data = await res.json();

  if (!res.ok || data?.error) {
    throw new ProviderError(
      res.status,
      data?.error?.message ?? `HTTP ${res.status}`,
    );
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError(502, "empty output");
  return text;
}

async function callGemini(
  model: string,
  userMessage: string,
  systemPrompt?: string | null,
  image?: { data: string; mimeType: string } | null,
): Promise<string> {
  const parts: object[] = [];
  if (image)
    parts.push({
      inline_data: { mime_type: image.mimeType, data: image.data },
    });
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
    throw new ProviderError(
      data.error.code ?? res.status,
      data.error.message ?? "gemini error",
    );
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ProviderError(502, "empty output");
  return text;
}

// ─────────────────────────────────────────────────────────────
// Run the chain
// ─────────────────────────────────────────────────────────────
async function runChain(args: {
  userMessage: string;
  systemPrompt?: string | null;
  imageUrl?: string | null;
  selectedModel?: string | null;
}): Promise<{
  output: string;
  model: string;
  provider: Provider;
  fallback: boolean;
}> {
  const { userMessage, systemPrompt, imageUrl, selectedModel } = args;

  const chain = buildChain(selectedModel, !!imageUrl);
  console.log(`🔗 chain: ${chain.map(label).join(" -> ")}`);

  // Load the image once (only Gemini uses it)
  let image: { data: string; mimeType: string } | null = null;
  if (imageUrl) {
    try {
      image = await fetchImageAsBase64(imageUrl);
    } catch (err) {
      console.warn(`⚠️ Could not load image, continuing text-only: ${err}`);
    }
  }

  const skipped: string[] = [];

  for (const step of chain) {
    // Skip a provider whose key is missing instead of failing the whole run
    if (step.provider === "groq" && !process.env.GROQ_API_KEY) {
      skipped.push(`${label(step)}(no_key)`);
      continue;
    }
    if (step.provider === "gemini" && !process.env.GEMINI_API_KEY) {
      skipped.push(`${label(step)}(no_key)`);
      continue;
    }

    try {
      const output =
        step.provider === "groq"
          ? await callGroq(step.model, userMessage, systemPrompt)
          : await callGemini(step.model, userMessage, systemPrompt, image);

      console.log(
        skipped.length > 0
          ? `⚡ skipped: [${skipped.join(", ")}] -> ✅ using ${label(step)}`
          : `✅ using ${label(step)}`,
      );

      return {
        output,
        model: step.model,
        provider: step.provider,
        fallback: false,
      };
    } catch (err) {
      const status = err instanceof ProviderError ? err.status : 0;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ ${label(step)} failed [${status}]: ${msg}`);
      skipped.push(`${label(step)}(${status ? classify(status) : "network"})`);
    }
  }

  const hasQuota = skipped.some((s) => s.includes("quota"));
  console.log(`⚠️ all models unavailable [${skipped.join(", ")}]`);

  return {
    output: hasQuota
      ? "Rate limit reached. Please wait a moment and try again."
      : "AI models are currently unavailable. Please try again later.",
    model: "none",
    provider: "groq",
    fallback: true,
  };
}

// ─────────────────────────────────────────────────────────────
// Trigger.dev task
// ─────────────────────────────────────────────────────────────
export const runLLMTask = task({
  id: "run-llm",
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload: {
    userMessage: string;
    systemPrompt?: string | null;
    imageUrl?: string | null;
    selectedModel?: string | null; // "default" or a model id from the node dropdown
    workflowId?: string;
    nodeId?: string;
  }) => {
    const {
      userMessage,
      systemPrompt,
      imageUrl,
      selectedModel,
      workflowId,
      nodeId,
    } = payload;

    console.log(
      `🔥 run-llm | workflow: ${workflowId ?? "?"} | node: ${nodeId ?? "?"}`,
    );
    console.log(`📝 user_message: ${userMessage}`);
    console.log(`🎭 system_prompt: ${systemPrompt ?? "none"}`);
    console.log(`🖼️ image_url: ${imageUrl ?? "none"}`);
    console.log(`🎛️ selected_model: ${selectedModel ?? "default"}`);

    if (!userMessage?.trim()) {
      return {
        success: false,
        output: "No message provided.",
        model: "none",
        provider: "groq",
        fallback: true,
      };
    }

    const result = await runChain({
      userMessage,
      systemPrompt,
      imageUrl,
      selectedModel,
    });

    return { success: !result.fallback, ...result };
  },
});