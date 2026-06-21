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

    const { conversationId, noteText } = await req.json();

    if (!conversationId || !noteText?.trim()) {
      return NextResponse.json({ error: "conversationId and noteText required" }, { status: 400 });
    }

    const orgId = await getOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 });
    }

    const service = createServiceClient();

    // Verify conversation belongs to org
    const { data: conv } = await service
      .from("conversations")
      .select("id, chatbots!inner(org_id)")
      .eq("id", conversationId)
      .single();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { data: note, error } = await service
      .from("conversation_notes")
      .insert({
        conversation_id: conversationId,
        agent_id: user.id,
        note_text: noteText.trim(),
      })
      .select("*, agent:profiles(email, full_name)")
      .single();

    if (error) {
      // conversation_notes may not exist yet (migration not applied) — return graceful error
      return NextResponse.json(
        { error: "Notes table not ready. Apply the Phase 1 migration first." },
        { status: 503 }
      );
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: notes, error } = await service
      .from("conversation_notes")
      .select("*, agent:profiles(email, full_name)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ notes: [] });
    }

    return NextResponse.json({ notes: notes ?? [] });
  } catch (error) {
    console.error("Notes GET error:", error);
    return NextResponse.json({ notes: [] });
  }
}
