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

    const { chatbotId, visitorName, visitorEmail, initialMessage } = await req.json();

    if (!chatbotId) {
      return NextResponse.json(
        { error: "chatbotId is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify chatbot belongs to user's org
    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("id, org_id, status")
      .eq("id", chatbotId)
      .eq("org_id", orgId)
      .single();

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404 }
      );
    }

    // Create conversation with admin-generated session ID
    const sessionId = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        visitor_name: visitorName || "Test User",
        visitor_email: visitorEmail || null,
        page_url: "Admin Dashboard (Manual Creation)",
        browser_info: "Admin Created",
        status: "open",
      })
      .select()
      .single();

    if (convError) {
      return NextResponse.json(
        { error: convError.message },
        { status: 500 }
      );
    }

    // Create initial message if provided
    if (initialMessage && initialMessage.trim()) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "user",
        content: initialMessage.trim(),
      });
    }

    return NextResponse.json({ 
      success: true, 
      conversation 
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
