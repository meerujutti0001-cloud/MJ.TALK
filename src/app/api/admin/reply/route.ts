import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { conversationId, content } = body;

  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Verify the user has access to this conversation
  const { data: conv } = await serviceClient
    .from("conversations")
    .select("chatbot_id, chatbots(org_id)")
    .eq("id", conversationId)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const orgId = (conv as { chatbots?: { org_id?: string } }).chatbots?.org_id;

  // Check org access
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId!)
    .single();

  const { data: membership } = !org
    ? await supabase.from("team_members").select("id").eq("org_id", orgId!).eq("user_id", user.id).single()
    : { data: null };

  if (!org && !membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Insert admin message
  const { data: message, error } = await serviceClient
    .from("messages")
    .insert({ conversation_id: conversationId, role: "admin", content: content.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message });
}
