import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { canCreateConversation } from "@/lib/plan-limits";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatbotId, sessionId, visitorName, visitorEmail, pageUrl, browserInfo } = body;

    if (!chatbotId || !sessionId) {
      return NextResponse.json({ error: "chatbotId and sessionId required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify chatbot exists and is active
    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("id, status, org_id")
      .eq("id", chatbotId)
      .single();

    if (!chatbot || chatbot.status !== "active") {
      return NextResponse.json({ error: "Chatbot not available" }, { status: 404 });
    }

    // Check for existing conversation with this session (don't count resume as new)
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("chatbot_id", chatbotId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ conversation: existing }, { headers: CORS_HEADERS });
    }

    // ── Plan limit check (only for new conversations) ──
    if (chatbot.org_id) {
      const check = await canCreateConversation(chatbot.org_id);
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: "chat_limit_reached",
            message: check.reason,
            limit: check.limit,
            used: check.used,
            upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/purchase/premium`,
          },
          { status: 429, headers: CORS_HEADERS }
        );
      }
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        visitor_name: visitorName ?? null,
        visitor_email: visitorEmail ?? null,
        page_url: pageUrl ?? null,
        browser_info: browserInfo ?? null,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversation }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Conversation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
