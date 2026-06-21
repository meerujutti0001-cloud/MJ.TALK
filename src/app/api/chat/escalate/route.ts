import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      chatbotId,
      sessionId,
      conversationId: existingConvId,
      visitorName,
      visitorEmail,
      pageUrl,
      browserInfo,
    } = body;

    if (!chatbotId || !sessionId) {
      return NextResponse.json(
        { error: "chatbotId and sessionId required" },
        { status: 400, headers: CORS }
      );
    }

    const supabase = createServiceClient();

    // Verify chatbot exists and is active
    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("id, name, org_id, status, escalation_keyword")
      .eq("id", chatbotId)
      .single();

    if (!chatbot || chatbot.status !== "active") {
      return NextResponse.json(
        { error: "Chatbot not available" },
        { status: 404, headers: CORS }
      );
    }

    let conversationId = existingConvId;

    // Step 1 — Create or update conversation
    if (!conversationId) {
      // Check if one exists for this session
      const { data: existing } = await supabase
        .from("conversations")
        .select("id, status")
        .eq("chatbot_id", chatbotId)
        .eq("session_id", sessionId)
        .single();

      if (existing) {
        conversationId = existing.id;
      } else {
        // Create fresh conversation
        const { data: newConv, error: convErr } = await supabase
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
          .select("id")
          .single();

        if (convErr || !newConv) {
          return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500, headers: CORS }
          );
        }
        conversationId = newConv.id;
      }
    }

    // Step 2 — Mark conversation as escalated
    await supabase
      .from("conversations")
      .update({
        status: "escalated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    // Step 3 — Insert system message visible in chat thread
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content:
        "🙋 **Human agent requested.** You have been connected to the support queue. An agent will join this chat shortly. Please stay on the page.",
    });

    // Step 4 — Insert user message recording the request
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: "[ Requested to speak with a human agent ]",
    });

    // Step 5 — Create high-priority notification for the org
    const { error: notifErr } = await supabase.from("notifications").insert({
      org_id: chatbot.org_id,
      conversation_id: conversationId,
      type: "escalated",
      message: `🚨 Human agent requested by ${visitorName ?? "a visitor"}${visitorEmail ? ` (${visitorEmail})` : ""}`,
      read: false,
    });

    if (notifErr) {
      console.error("Notification insert error:", notifErr);
    }

    return NextResponse.json(
      { success: true, conversationId },
      { headers: CORS }
    );
  } catch (error) {
    console.error("Escalate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
