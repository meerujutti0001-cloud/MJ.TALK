import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req: NextRequest) {
  const chatbotId = req.nextUrl.searchParams.get("chatbotId");

  if (!chatbotId) {
    return NextResponse.json({ error: "chatbotId required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("id, name, widget_color, avatar_url, pre_chat_form_enabled, escalation_keyword, status")
    .eq("id", chatbotId)
    .single();

  if (error || !chatbot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ config: chatbot }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
