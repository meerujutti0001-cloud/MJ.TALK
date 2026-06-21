import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// CORS — widget calls this from any domain
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Broadcasts a typing event by upserting a lightweight row in a
 * `typing_indicators` table (created in the migration).
 * If the table doesn't exist yet we silently fall back — the rest of
 * the chat still works.
 *
 * Body: { conversationId, role: "user"|"admin", isTyping: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationId, role, isTyping } = await req.json();

    if (!conversationId || !role) {
      return NextResponse.json(
        { error: "conversationId and role required" },
        { status: 400, headers: CORS }
      );
    }

    const supabase = createServiceClient();

    if (isTyping) {
      await supabase.from("typing_indicators").upsert(
        {
          conversation_id: conversationId,
          role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "conversation_id,role" }
      );
    } else {
      await supabase
        .from("typing_indicators")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("role", role);
    }

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch {
    // Table may not exist yet — not a fatal error
    return NextResponse.json({ ok: true }, { headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
