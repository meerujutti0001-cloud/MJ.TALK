import { NextResponse } from "next/server";

const MODELS = [
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.1-8b-instruct",
  "anthropic/claude-3-haiku",
];

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not set on Vercel" }, { status: 500 });
  }

  const results: Record<string, string> = {};

  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mj-talk.vercel.app",
          "X-Title": "MJ.TALK Test",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Say only: OK" }],
          max_tokens: 10,
          stream: false,
        }),
      });
      const text = await res.text();
      let reply = "";
      try { reply = JSON.parse(text)?.choices?.[0]?.message?.content ?? ""; } catch { reply = text.slice(0, 100); }
      results[model] = reply || `(empty) status=${res.status}`;
      if (reply) break; // found a working model
    } catch (e) {
      results[model] = `ERROR: ${e}`;
    }
  }

  return NextResponse.json({
    key_prefix: key.slice(0, 16) + "...",
    results,
  });
}
