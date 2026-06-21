import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, agentId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    const orgId = await getOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 });
    }

    const service = createServiceClient();

    // Verify conversation belongs to this org
    const { data: conv } = await service
      .from("conversations")
      .select("id, chatbot_id, chatbots!inner(org_id)")
      .eq("id", conversationId)
      .single();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Update assigned agent (null = unassign)
    const { error } = await service
      .from("conversations")
      .update({
        assigned_agent_id: agentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignedTo: agentId ?? null });
  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
