import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });
  }

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
        max_tokens: 20,
        stream: false,
      }),
    });

    const text = await res.text(); // read raw text first
    let data = null;
    try { data = JSON.parse(text); } catch { /* not json */ }

    const reply = data?.choices?.[0]?.message?.content ?? null;

    return NextResponse.json({
      key_prefix: key.slice(0, 16) + "...",
      http_status: res.status,
      raw_response: text.slice(0, 1000), // first 1000 chars
      reply,
      error: data?.error ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
