import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { chatModel } from "@/lib/ai";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, chatbotId, conversationId } = body;

    if (!chatbotId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch chatbot
    const { data: chatbot, error: chatbotError } = await supabase
      .from("chatbots")
      .select("id, system_prompt, status, escalation_keyword, allowed_domains, org_id")
      .eq("id", chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    if (chatbot.status !== "active") {
      return NextResponse.json({ error: "Chatbot is inactive" }, { status: 403 });
    }

    // Domain allowlist check
    const origin = req.headers.get("origin") ?? "";
    if (chatbot.allowed_domains && chatbot.allowed_domains.length > 0) {
      const allowed = chatbot.allowed_domains.some((domain: string) => {
        try {
          const url = new URL(origin);
          return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
        } catch { return false; }
      });
      if (!allowed && origin) {
        return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
      }
    }

    // Stream AI response
    const result = streamText({
      model: chatModel,
      system: chatbot.system_prompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      maxOutputTokens: 1024,
      onFinish: async ({ text }) => {
        if (conversationId) {
          // Persist assistant message
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: text,
          });

          // Check for escalation keyword
          const keyword = (chatbot.escalation_keyword ?? "ESCALATE").toUpperCase();
          if (text.toUpperCase().includes(keyword)) {
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
      },
    });

    // Return a text stream — the widget reads plain text chunks
    const response = result.toTextStreamResponse();

    // Add CORS headers
    const headers = new Headers(response.headers);
    Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
