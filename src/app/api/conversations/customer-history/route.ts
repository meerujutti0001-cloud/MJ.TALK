import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/conversations/customer-history?email=...&currentId=...
 * Returns previous conversations for a visitor email (excluding current one).
 * Used by the Customer Details Panel in the admin inbox.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const currentId = searchParams.get("currentId");

  if (!email) {
    return NextResponse.json({ conversations: [], total: 0 });
  }

  const supabase = createServiceClient();

  let query = supabase
    .from("conversations")
    .select("id, status, message_count, created_at, updated_at, chatbot:chatbots(name)")
    .eq("visitor_email", email)
    .order("created_at", { ascending: false })
    .limit(10);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data ?? [], total: data?.length ?? 0 });
}
