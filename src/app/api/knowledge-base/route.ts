import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrgId } from "@/lib/get-org";

/** GET /api/knowledge-base?chatbotId=...  — list articles */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = await getOrgId(user.id);
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const chatbotId = searchParams.get("chatbotId");
    const category  = searchParams.get("category");

    const supabase = createServiceClient();
    let query = supabase
      .from("kb_articles")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (chatbotId) query = query.eq("chatbot_id", chatbotId);
    if (category && category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ articles: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST /api/knowledge-base  — create article */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = await getOrgId(user.id);
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

    const body = await req.json();
    const { chatbotId, title, content, category = "general", tags = [], isPublished = true } = body;

    if (!chatbotId || !title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "chatbotId, title, content required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify chatbot belongs to org
    const { data: bot } = await supabase
      .from("chatbots")
      .select("id")
      .eq("id", chatbotId)
      .eq("org_id", orgId)
      .maybeSingle();

    if (!bot) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("kb_articles")
      .insert({
        chatbot_id:   chatbotId,
        org_id:       orgId,
        title:        title.trim(),
        content:      content.trim(),
        category,
        tags:         Array.isArray(tags) ? tags : [],
        is_published: isPublished,
        created_by:   user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ article: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
