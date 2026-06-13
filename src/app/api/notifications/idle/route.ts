import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// This route creates "idle" notifications for open conversations
// that have had no new messages in the last 30 minutes.
// Call it from a cron job or Supabase scheduled function.
export async function POST(req: NextRequest) {
  // Simple secret check to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Find open conversations with no activity in last 30 min
  const { data: idleConvs } = await supabase
    .from("conversations")
    .select("id, chatbot_id, visitor_name, chatbots(org_id)")
    .eq("status", "open")
    .lt("updated_at", thirtyMinutesAgo);

  if (!idleConvs || idleConvs.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  let notified = 0;
  for (const conv of idleConvs) {
    const orgId = (conv as { chatbots?: { org_id?: string } }).chatbots?.org_id;
    if (!orgId) continue;

    // Check if we already created an idle notification for this conversation recently
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("conversation_id", conv.id)
      .eq("type", "idle")
      .gte("created_at", thirtyMinutesAgo)
      .single();

    if (existing) continue;

    await supabase.from("notifications").insert({
      org_id: orgId,
      conversation_id: conv.id,
      type: "idle",
      message: `Conversation with ${conv.visitor_name ?? "Anonymous"} has been idle for 30 minutes.`,
    });
    notified++;
  }

  return NextResponse.json({ notified });
}
