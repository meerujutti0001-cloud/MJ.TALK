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

async function callOpenRouterStreaming(
  key: string,
  model: string,
  apiMessages: { role: string; content: string }[],
  appUrl: string
): Promise<ReadableStream> {
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
      stream: true,  // Enable streaming
      temperature: 0.7,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Model ${model} failed with status ${res.status}`);
  }

  return res.body;
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

    // Try streaming with first model
    let streamBody: ReadableStream | null = null;
    let fullText = "";

    try {
      streamBody = await callOpenRouterStreaming(key, MODELS[0], apiMessages, appUrl);
      
      // Create a transform stream to capture the full text while streaming
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const textDecoder = new TextDecoder();
      
      // Process the stream
      (async () => {
        try {
          const reader = streamBody!.getReader();
          let buffer = "";
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += textDecoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                
                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullText += content;
                    await writer.write(new TextEncoder().encode(content));
                  }
                } catch {
                  // ignore parse errors
                }
              }
            }
          }
          
          // Save to database after streaming completes
          if (conversationId && fullText) {
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullText,
            });
            
            // Check for escalation
            const keyword = (chatbot.escalation_keyword ?? "ESCALATE").toUpperCase();
            if (fullText.toUpperCase().includes(keyword)) {
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
        } catch (e) {
          console.error("Streaming error:", e);
        } finally {
          await writer.close();
        }
      })();

      const headers = new Headers(CORS as Record<string, string>);
      headers.set("Content-Type", "text/event-stream");
      headers.set("Cache-Control", "no-cache, no-store");
      headers.set("Connection", "keep-alive");

      return new Response(readable, { status: 200, headers });
      
    } catch (streamError) {
      console.warn("Streaming failed, falling back to non-streaming:", streamError);
      
      // Fallback to non-streaming
      let replyText = "";
      for (const model of MODELS) {
        try {
          const nonStreamRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

          const raw = await nonStreamRes.text();
          try {
            const data = JSON.parse(raw);
            replyText = data.choices?.[0]?.message?.content?.trim() ?? "";
            if (replyText) break;
          } catch { /* parse failed */ }
        } catch (e) {
          console.warn(`Fallback model ${model} threw:`, e);
        }
      }

      if (!replyText) {
        replyText = "I'm having trouble connecting right now. Please try again in a moment.";
      }

      // Persist fallback message
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
    }

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
