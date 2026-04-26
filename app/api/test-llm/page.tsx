"use client";

import { useState } from "react";

export default function TestLLMPage() {
  const [prompt, setPrompt] = useState(
    "Explain what a workflow engine is in 2 sentences.",
  );
  const [workflowId, setWorkflowId] = useState("test-workflow-001");
  const [output, setOutput] = useState("");
  const [usedModel, setUsedModel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setOutput("");
    setError("");
    setUsedModel("");

    try {
      const res = await fetch("/api/run-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, workflowId }),
      });

      const data = await res.json();

      if (data.success) {
        setOutput(data.output);
        setUsedModel(data.model); // 👈 show which model responded
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to reach /api/run-llm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-2xl font-bold">🧠 Test Gemini LLM</h1>

      <div className="w-full max-w-xl flex flex-col gap-1">
        <label className="text-sm text-neutral-400">Workflow ID</label>
        <input
          type="text"
          value={workflowId}
          onChange={(e) => setWorkflowId(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="w-full max-w-xl flex flex-col gap-1">
        <label className="text-sm text-neutral-400">Prompt</label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <button
        onClick={runTest}
        disabled={loading}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        {loading ? "Trying models..." : "🚀 Run LLM"}
      </button>

      {/* Which model responded */}
      {usedModel && (
        <div className="w-full max-w-xl px-4 py-2 rounded-lg bg-blue-900/30 border border-blue-700 text-blue-300 text-sm">
          🤖 <span className="font-semibold">Model used:</span> {usedModel}
        </div>
      )}

      {/* Success */}
      {output && (
        <div className="w-full max-w-xl p-4 rounded-lg bg-green-900/30 border border-green-700 text-green-300 whitespace-pre-wrap">
          ✅ <span className="font-semibold">Output:</span>
          <p className="mt-2">{output}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-xl p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-300">
          ❌ <span className="font-semibold">Error:</span> {error}
        </div>
      )}
    </main>
  );
}
