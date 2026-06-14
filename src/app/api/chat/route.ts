import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not set on server" },
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

    // Build messages for OpenRouter
    const apiMessages = [
      {
        role: "system",
        content: chatbot.system_prompt || "You are a helpful customer support assistant.",
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Call OpenRouter — NON-streaming for reliability
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app",
        "X-Title": "MJ.TALK Support",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: apiMessages,
        max_tokens: 1024,
        stream: false,  // non-streaming — most reliable across all environments
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      console.error("OpenRouter error:", orRes.status, errText);
      return NextResponse.json(
        { error: "AI service error", detail: errText },
        { status: 502, headers: CORS }
      );
    }

    const data = await orRes.json();
    const replyText: string = data.choices?.[0]?.message?.content ?? "";

    if (!replyText) {
      console.error("Empty reply from OpenRouter:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502, headers: CORS }
      );
    }

    // Persist assistant message
    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: replyText,
      });

      // Escalation check
      const keyword = (chatbot.escalation_keyword ?? "ESCALATE").toUpperCase();
      if (replyText.toUpperCase().includes(keyword)) {
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
      }
    }

    // Return plain text — widget reads it all at once
    const headers = new Headers(CORS as Record<string, string>);
    headers.set("Content-Type", "text/plain; charset=utf-8");
    headers.set("Cache-Control", "no-cache, no-store");

    return new Response(replyText, { status: 200, headers });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: CORS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
