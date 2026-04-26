export async function POST(req: Request) {
  try {
    const { prompt, workflowId } = await req.json();

    console.log("🔥 Running LLM for:", workflowId);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt || "Say hello" }],
            },
          ],
        }),
      },
    );

    const data = await res.json();

    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No output";

    console.log("🧠 Output:", output);

    return Response.json({
      success: true,
      output,
    });
  } catch (err) {
    console.error(err);

    return Response.json({
      success: false,
      error: String(err),
    });
  }
}
