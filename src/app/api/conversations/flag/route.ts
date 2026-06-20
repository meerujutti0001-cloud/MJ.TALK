import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrgId } from "@/lib/get-org";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = await getOrgId(user.id);
    
    if (!orgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 }
      );
    }

    const { conversationId, message } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify conversation belongs to user's org
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, chatbot_id, chatbots!inner(org_id)")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify the chatbot belongs to the user's org
    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("org_id")
      .eq("id", conversation.chatbot_id)
      .single();

    if (!chatbot || chatbot.org_id !== orgId) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create notification
    await supabase.from("notifications").insert({
      org_id: orgId,
      conversation_id: conversationId,
      type: "flagged",
      message: message || `Conversation flagged by ${user.email} for review`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Flag conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
