import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SYSTEM_PROMPT = `You are the friendly support assistant for MJ.TALK — an AI-powered live chat platform for businesses.

You help website visitors understand:
- What MJ.TALK is and how it works
- Features: live chat, AI chatbot, team inbox, visitor analytics, integrations
- Pricing: Free plan (500 chats/month), Pro plan, Enterprise
- Setup: copy one script tag, paste before </body>, done in 5 minutes
- How to create an account and get started

Be concise, warm, and helpful. If someone asks something you don't know, suggest they email support@mjtalk.com or sign up to try it free.
Never make up pricing numbers you're unsure of — direct them to the pricing section instead.`;

export async function POST(req: NextRequest) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500, headers: CORS });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: CORS });
    }

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app",
        "X-Title": "MJ.TALK Platform Support",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: apiMessages,
        max_tokens: 512,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      console.error("OpenRouter platform-chat error:", orRes.status, errText);
      return NextResponse.json({ error: "AI error" }, { status: 502, headers: CORS });
    }

    const data = await orRes.json();
    const reply: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply) {
      return new Response(
        "I'm having a moment — please try again!",
        { status: 200, headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    return new Response(reply, {
      status: 200,
      headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });

  } catch (error) {
    console.error("platform-chat error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
