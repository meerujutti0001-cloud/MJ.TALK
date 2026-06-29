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

  // Build conversation list query
  const chatbotsPromise = supabase
    .from("chatbots")
    .select("id, name, widget_color")
    .eq("org_id", orgId)
    .order("name");

  // If a specific conversation is selected, fetch it + messages in parallel
  const selectedConvPromise = searchParams.id
    ? supabase
        .from("conversations")
        .select("*, chatbot:chatbots(id, name, widget_color, escalation_keyword)")
        .eq("id", searchParams.id)
        .maybeSingle()
    : Promise.resolve({ data: null });

  // Run chatbots + selected conv in parallel
  const [{ data: chatbots }, selectedConvResult] = await Promise.all([
    chatbotsPromise,
    selectedConvPromise,
  ]);

  const chatbotIds = chatbots?.map((c) => c.id) ?? [];

  // Build filtered conversations query + messages in parallel
  let query = supabase
    .from("conversations")
    .select("*, chatbot:chatbots(id, name, widget_color)")
    .in("chatbot_id", chatbotIds.length > 0 ? chatbotIds : ["_none_"])
    .order("updated_at", { ascending: false });

  if (searchParams.status && ["open", "escalated", "resolved"].includes(searchParams.status)) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.chatbot) query = query.eq("chatbot_id", searchParams.chatbot);
  if (searchParams.q) {
    query = query.or(`visitor_name.ilike.%${searchParams.q}%,visitor_email.ilike.%${searchParams.q}%`);
  }

  const selectedConv = selectedConvResult.data;

  // Conversations list + messages for selected conv — in parallel
  const [{ data: conversations }, { data: messages }] = await Promise.all([
    query.limit(100),
    selectedConv
      ? supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", selectedConv.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: null }),
  ]);

  return (
    <ConversationInbox
      conversations={conversations ?? []}
      chatbots={chatbots ?? []}
      selectedConversation={selectedConv}
      messages={messages ?? []}
      searchParams={searchParams}
    />
  );
}
