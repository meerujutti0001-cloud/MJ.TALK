import { NextResponse } from "next/server";
import { streamText } from "ai";
import { chatModel } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  const keyPrefix = process.env.OPENROUTER_API_KEY?.slice(0, 12) ?? "NOT SET";

  if (!hasKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not set", keyPrefix });
  }

  try {
    const result = streamText({
      model: chatModel,
      messages: [{ role: "user", content: "Say exactly: WORKING" }],
      maxOutputTokens: 20,
    });

    let text = "";
    for await (const chunk of result.textStream) {
      text += chunk;
    }

    return NextResponse.json({ ok: true, keyPrefix, response: text });
  } catch (e) {
    return NextResponse.json({
      error: "AI call failed",
      detail: e instanceof Error ? e.message : String(e),
      keyPrefix,
    }, { status: 500 });
  }
}
