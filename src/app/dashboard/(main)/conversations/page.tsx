import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { ConversationInbox } from "@/components/dashboard/conversation-inbox";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: { status?: string; id?: string; chatbot?: string; q?: string };
}) {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  const supabase = createServiceClient();

  // Fetch chatbots for filter dropdown
  const { data: chatbots } = await supabase
    .from("chatbots")
    .select("id, name, widget_color")
    .eq("org_id", orgId)
    .order("name");

  const chatbotIds = chatbots?.map((c) => c.id) ?? [];

  // Build conversation query
  let query = supabase
    .from("conversations")
    .select("*, chatbot:chatbots(id, name, widget_color)")
    .in("chatbot_id", chatbotIds.length > 0 ? chatbotIds : ["_none_"])
    .order("updated_at", { ascending: false });

  if (searchParams.status && ["open", "escalated", "resolved"].includes(searchParams.status)) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.chatbot) {
    query = query.eq("chatbot_id", searchParams.chatbot);
  }
  if (searchParams.q) {
    query = query.or(
      `visitor_name.ilike.%${searchParams.q}%,visitor_email.ilike.%${searchParams.q}%`
    );
  }

  const { data: conversations } = await query.limit(100);

  // Fetch selected conversation + its messages
  let selectedConversation = null;
  let messages = null;

  if (searchParams.id) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("*, chatbot:chatbots(id, name, widget_color, escalation_keyword)")
      .eq("id", searchParams.id)
      .maybeSingle();

    selectedConversation = conv;

    if (conv) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });
      messages = msgs;
    }
  }

  return (
    <ConversationInbox
      conversations={conversations ?? []}
      chatbots={chatbots ?? []}
      selectedConversation={selectedConversation}
      messages={messages ?? []}
      searchParams={searchParams}
    />
  );
}
