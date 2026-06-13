import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { WidgetApp } from "@/components/widget/widget-app";

export default async function WidgetPage({ params }: { params: { chatbotId: string } }) {
  const supabase = createServiceClient();

  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id, name, widget_color, avatar_url, pre_chat_form_enabled, escalation_keyword, status")
    .eq("id", params.chatbotId)
    .single();

  if (!chatbot || chatbot.status !== "active") notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <WidgetApp
      config={{
        id: chatbot.id,
        name: chatbot.name,
        widget_color: chatbot.widget_color,
        avatar_url: chatbot.avatar_url,
        pre_chat_form_enabled: chatbot.pre_chat_form_enabled,
        escalation_keyword: chatbot.escalation_keyword,
        status: chatbot.status,
      }}
      apiUrl={appUrl}
    />
  );
}
