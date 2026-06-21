import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MODELS = [
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.1-8b-instruct",
  "anthropic/claude-3-haiku",
];

/* ── Intent keywords → label ── */
const INTENT_PATTERNS: Array<{ label: string; keywords: string[] }> = [
  { label: "refund",    keywords: ["refund","money back","return","reimburse","charge back"] },
  { label: "billing",   keywords: ["bill","invoice","payment","charge","subscription","plan","price","cost"] },
  { label: "account",   keywords: ["login","password","account","signup","register","access","locked","email"] },
  { label: "technical", keywords: ["error","bug","crash","not working","broken","issue","fail","down","slow"] },
  { label: "complaint", keywords: ["complaint","angry","frustrated","terrible","worst","awful","disgusted","upset"] },
  { label: "setup",     keywords: ["setup","install","configure","integration","how to","get started","onboard"] },
];

function detectIntent(text: string): { label: string; confidence: number } {
  const lower = text.toLowerCase();
  for (const { label, keywords } of INTENT_PATTERNS) {
    const matched = keywords.filter((k) => lower.includes(k)).length;
    if (matched > 0) {
      return { label, confidence: Math.min(0.5 + matched * 0.15, 0.95) };
    }
  }
  return { label: "general", confidence: 0.5 };
}

/* ── Fetch relevant KB articles for this chatbot ── */
async function getKbContext(supabase: ReturnType<typeof createServiceClient>, chatbotId: string, userMessage: string): Promise<string> {
  try {
    const { data: articles } = await supabase
      .from("kb_articles")
      .select("title, content, category")
      .eq("chatbot_id", chatbotId)
      .eq("is_published", true)
      .limit(8);

    if (!articles || articles.length === 0) return "";

    // Simple keyword relevance scoring
    const lower = userMessage.toLowerCase();
    const scored = articles.map((a) => {
      const combined = `${a.title} ${a.content}`.toLowerCase();
      const words = lower.split(/\s+/).filter((w) => w.length > 3);
      const hits = words.filter((w) => combined.includes(w)).length;
      return { ...a, score: hits };
    });

    const relevant = scored
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (relevant.length === 0) return "";

    const kbText = relevant
      .map((a) => `[KB: ${a.title}]\n${a.content}`)
      .join("\n\n---\n\n");

    return `\n\n--- KNOWLEDGE BASE CONTEXT ---\nUse the following knowledge base articles to answer accurately. Do NOT mention that you are using a knowledge base.\n\n${kbText}\n--- END KB CONTEXT ---`;
  } catch {
    return "";
  }
}

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
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Model ${model} failed with status ${res.status}`);
  }

  return res.body;
}

/* ── Shared post-completion side effects ── */
async function handleCompletion(
  supabase: ReturnType<typeof createServiceClient>,
  conversationId: string | undefined,
  chatbotId: string,
  orgId: string,
  fullText: string,
  escalationKeyword: string,
  userMessage: string
) {
  if (!conversationId || !fullText) return;

  // 1. Persist AI message
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: fullText,
  });

  // 2. Detect intent from user message and upsert ai_session
  try {
    const intent = detectIntent(userMessage);
    await supabase
      .from("ai_sessions")
      .upsert(
        {
          conversation_id:    conversationId,
          detected_intent:    intent.label,
          intent_label:       intent.label,
          intent_confidence:  intent.confidence,
          escalated_to_human: false,
          updated_at:         new Date().toISOString(),
        },
        { onConflict: "conversation_id" }
      );
  } catch { /* non-critical */ }

  // 3. Escalation check
  const keyword = (escalationKeyword ?? "ESCALATE").toUpperCase();
  if (fullText.toUpperCase().includes(keyword)) {
    await supabase
      .from("conversations")
      .update({ status: "escalated" })
      .eq("id", conversationId);

    await supabase.from("notifications").insert({
      org_id:          orgId,
      conversation_id: conversationId,
      type:            "escalated",
      message:         "A conversation has been escalated and needs human attention.",
      priority:        "high",
    });

    // Mark ai_session as escalated
    await supabase
      .from("ai_sessions")
      .upsert(
        {
          conversation_id:    conversationId,
          escalated_to_human: true,
          escalation_reason:  "AI triggered escalation keyword",
          updated_at:         new Date().toISOString(),
        },
        { onConflict: "conversation_id" }
      );
  }
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
      .select("id, system_prompt, status, escalation_keyword, org_id")
      .eq("id", chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404, headers: CORS });
    }
    if (chatbot.status !== "active") {
      return NextResponse.json({ error: "Chatbot inactive" }, { status: 403, headers: CORS });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";

    // Last user message for KB lookup + intent detection
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";

    // Inject KB context into system prompt
    const kbContext = await getKbContext(supabase, chatbotId, lastUserMsg);
    const systemContent = (chatbot.system_prompt || "You are a helpful customer support assistant. Be concise and friendly.") + kbContext;

    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let fullText = "";

    // ── Try streaming ──
    try {
      const streamBody = await callOpenRouterStreaming(key, MODELS[0], apiMessages, appUrl);

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const textDecoder = new TextDecoder();

      (async () => {
        try {
          const reader = streamBody.getReader();
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
                  const chunk = json.choices?.[0]?.delta?.content || "";
                  if (chunk) {
                    fullText += chunk;
                    await writer.write(new TextEncoder().encode(chunk));
                  }
                } catch { /* ignore SSE parse errors */ }
              }
            }
          }

          await handleCompletion(supabase, conversationId, chatbotId, chatbot.org_id, fullText, chatbot.escalation_keyword, lastUserMsg);
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
      console.warn("Streaming failed, falling back:", streamError);

      // ── Non-streaming fallback ──
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
            body: JSON.stringify({ model, messages: apiMessages, max_tokens: 1024, stream: false, temperature: 0.7 }),
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

      await handleCompletion(supabase, conversationId, chatbotId, chatbot.org_id, replyText, chatbot.escalation_keyword, lastUserMsg);

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
