const GEMINI_MODELS = [
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
];

async function callGemini(
  userMessage: string,
  systemPrompt?: string | null,
): Promise<{ output: string; model: string }> {
  let lastError = "";

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`🔄 Trying: ${model}`);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: userMessage }],
              },
            ],
            // 🔥 system_prompt as proper system instruction
            ...(systemPrompt && {
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
            }),
          }),
        },
      );

      const data = await res.json();

      if (data?.error) {
        console.warn(
          `⚠️ ${model} → [${data.error.code}] ${data.error.message}`,
        );
        lastError = `${model}: [${data.error.code}] ${data.error.message}`;
        continue;
      }

      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!output) {
        console.warn(`⚠️ ${model} → empty output`);
        lastError = `${model}: empty output`;
        continue;
      }

      console.log(`✅ Success → ${model}`);
      return { output, model };
    } catch (err) {
      console.warn(`❌ ${model} threw:`, err);
      lastError = String(err);
      continue;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
}

export async function POST(req: Request) {
  try {
    const { userMessage, systemPrompt, workflowId, nodeId } = await req.json();

    console.log("🔥 run-llm | workflow:", workflowId, "| node:", nodeId);
    console.log("📝 user_message:", userMessage);
    console.log("🎭 system_prompt:", systemPrompt ?? "none");

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from .env.local");
    }

    if (!userMessage) {
      throw new Error("user_message is required");
    }

    const { output, model } = await callGemini(userMessage, systemPrompt);

    console.log("🧠 Output:", output);

    return Response.json({ success: true, output, model });
  } catch (err) {
    console.error("❌ run-llm error:", err);
    return Response.json({ success: false, error: String(err) });
  }
}
