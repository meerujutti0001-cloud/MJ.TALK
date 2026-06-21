import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * POST /api/ai/handoff-summary
 * Generates an AI summary of a conversation for the agent joining a handoff.
 * Uses the last N messages and returns: problem, summary, suggested response.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500, headers: CORS });
  }

  try {
    const { conversationId } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400, headers: CORS });
    }

    const supabase = createServiceClient();

    // Check for cached summary
    const { data: existing } = await supabase
      .from("ai_sessions")
      .select("handoff_summary, intent_label, intent_confidence")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (existing?.handoff_summary) {
      return NextResponse.json({
        summary: existing.handoff_summary,
        intent: existing.intent_label,
        confidence: existing.intent_confidence,
        cached: true,
      }, { headers: CORS });
    }

    // Fetch last 20 messages
    const { data: messages } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (!messages || messages.length === 0) {
      return NextResponse.json({ summary: null }, { headers: CORS });
    }

    // Build conversation text for the AI
    const transcript = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "user" ? "Customer" : m.role === "admin" ? "Agent" : "AI"}: ${m.content}`)
      .join("\n");

    const prompt = `You are a support team assistant. Analyze this customer support conversation and provide a structured handoff summary for the human agent taking over.

CONVERSATION:
${transcript}

Respond in this exact JSON format (no markdown, just JSON):
{
  "problem": "One sentence describing the customer's core issue",
  "summary": "2-3 sentence summary of what happened in the conversation",
  "intent": "one of: refund, technical, account, billing, complaint, setup, general, other",
  "confidence": 0.0 to 1.0,
  "suggested_response": "A suggested first response for the agent to use"
}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrl,
        "X-Title": "MJ.TALK Handoff Summary",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("AI summary error:", err);
      return NextResponse.json({ summary: null, error: "AI unavailable" }, { headers: CORS });
    }

    const aiData = await res.json();
    const rawContent = aiData.choices?.[0]?.message?.content?.trim() ?? "";

    let parsed: {
      problem?: string;
      summary?: string;
      intent?: string;
      confidence?: number;
      suggested_response?: string;
    } = {};

    try {
      // Strip markdown code fences if present
      const jsonStr = rawContent.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback: just use raw text
      parsed = { summary: rawContent };
    }

    const handoffSummary = [
      parsed.problem ? `**Issue:** ${parsed.problem}` : null,
      parsed.summary ? `**Summary:** ${parsed.summary}` : null,
      parsed.suggested_response ? `**Suggested reply:** ${parsed.suggested_response}` : null,
    ].filter(Boolean).join("\n\n");

    // Upsert to ai_sessions
    await supabase
      .from("ai_sessions")
      .upsert({
        conversation_id:     conversationId,
        intent_label:        parsed.intent ?? "general",
        intent_confidence:   parsed.confidence ?? null,
        handoff_summary:     handoffSummary,
        escalated_to_human:  true,
        updated_at:          new Date().toISOString(),
      }, { onConflict: "conversation_id" });

    return NextResponse.json({
      summary: handoffSummary,
      problem: parsed.problem,
      intent: parsed.intent,
      confidence: parsed.confidence,
      suggestedResponse: parsed.suggested_response,
      cached: false,
    }, { headers: CORS });

  } catch (error) {
    console.error("Handoff summary error:", error);
    return NextResponse.json({ error: "Internal error", summary: null }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
