import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Models to try in order — verified working on OpenRouter free tier
const MODELS = [
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.1-8b-instruct",
  "anthropic/claude-3-haiku",
];

async function callOpenRouter(
  key: string,
  model: string,
  apiMessages: { role: string; content: string }[],
  appUrl: string
): Promise<{ text: string; status: number; raw: string }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-Title": "MJ.TALK Support",
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      max_tokens: 1024,
      stream: false,
      temperature: 0.7,
    }),
  });

  const raw = await res.text();
  let text = "";
  try {
    const data = JSON.parse(raw);
    text = data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch { /* parse failed */ }

  return { text, status: res.status, raw: raw.slice(0, 500) };
}

export async function POST(req: NextRequest) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured on server" },
      { status: 500, headers: CORS }
    );
  }

  try {
    const body = await req.json();
    const { messages, chatbotId, conversationId } = body;

    if (!chatbotId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: CORS });
    }

    const supabase = createServiceClient();

    const { data: chatbot, error: chatbotError } = await supabase
      .from("chatbots")
      .select("id, system_prompt, status, escalation_keyword, allowed_domains, org_id")
      .eq("id", chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404, headers: CORS });
    }
    if (chatbot.status !== "active") {
      return NextResponse.json({ error: "Chatbot inactive" }, { status: 403, headers: CORS });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";

    const apiMessages = [
      {
        role: "system",
        content: chatbot.system_prompt || "You are a helpful customer support assistant. Be concise and friendly.",
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Try each model until one returns a non-empty response
    let replyText = "";
    let lastRaw = "";
    for (const model of MODELS) {
      try {
        const result = await callOpenRouter(key, model, apiMessages, appUrl);
        lastRaw = result.raw;
        if (result.text) {
          replyText = result.text;
          break;
        }
        console.warn(`Model ${model} returned empty. Status: ${result.status}. Raw: ${result.raw.slice(0, 200)}`);
      } catch (e) {
        console.warn(`Model ${model} threw:`, e);
      }
    }

    if (!replyText) {
      console.error("All models returned empty. Last raw:", lastRaw);
      // Fallback so user always gets a response
      replyText = "I'm having trouble connecting right now. Please try again in a moment.";
    }

    // Persist assistant message
    if (conversationId) {
      try {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: replyText,
        });
      } catch (e) { console.error("Persist error:", e); }

      // Escalation check
      const keyword = (chatbot.escalation_keyword ?? "ESCALATE").toUpperCase();
      if (replyText.toUpperCase().includes(keyword)) {
        try {
          await supabase
            .from("conversations")
            .update({ status: "escalated" })
            .eq("id", conversationId);

          const { data: conv } = await supabase
            .from("conversations")
            .select("chatbot_id")
            .eq("id", conversationId)
            .single();

          if (conv) {
            const { data: bot } = await supabase
              .from("chatbots")
              .select("org_id")
              .eq("id", conv.chatbot_id)
              .single();

            if (bot) {
              await supabase.from("notifications").insert({
                org_id: bot.org_id,
                conversation_id: conversationId,
                type: "escalated",
                message: "A conversation has been escalated and needs human attention.",
              });
            }
          }
        } catch (e) { console.error("Escalation error:", e); }
      }
    }

    const headers = new Headers(CORS as Record<string, string>);
    headers.set("Content-Type", "text/plain; charset=utf-8");
    headers.set("Cache-Control", "no-cache, no-store");

    return new Response(replyText, { status: 200, headers });

  } catch (error) {
    console.error("Chat API fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: CORS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
