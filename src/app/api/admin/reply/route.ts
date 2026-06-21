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

  // Use service client for ALL authorization checks — bypasses RLS so both
  // owners AND agents can be verified correctly without policy recursion.
  const serviceClient = createServiceClient();

  // Get the conversation and its org
  const { data: conv } = await serviceClient
    .from("conversations")
    .select("chatbot_id, chatbots(org_id)")
    .eq("id", conversationId)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const orgId = (conv as { chatbots?: { org_id?: string } }).chatbots?.org_id;

  if (!orgId) {
    return NextResponse.json({ error: "Conversation has no associated org" }, { status: 400 });
  }

  // Check if user is org owner
  const { data: ownedOrg } = await serviceClient
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("owner_id", user.id)
    .maybeSingle();

  // Check if user is an accepted agent in the org
  const { data: membership } = !ownedOrg
    ? await serviceClient
        .from("team_members")
        .select("id")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .not("accepted_at", "is", null)
        .maybeSingle()
    : { data: null };

  if (!ownedOrg && !membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Insert the admin reply using service client (bypasses messages RLS)
  const { data: message, error } = await serviceClient
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: "admin",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/reply] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update conversation updated_at so inbox re-sorts correctly
  await serviceClient
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ message });
}
