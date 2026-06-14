import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is NOT set on this server" }, { status: 500 });
  }

  // Test OpenRouter with a minimal non-streaming call
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
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Reply with exactly the word: WORKING" }],
        max_tokens: 10,
        stream: false,
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? null;

    return NextResponse.json({
      key_set: true,
      key_prefix: key.slice(0, 12) + "...",
      openrouter_status: res.status,
      reply,
      raw: data,
    });
  } catch (e) {
    return NextResponse.json({ key_set: true, error: String(e) }, { status: 500 });
  }
}
