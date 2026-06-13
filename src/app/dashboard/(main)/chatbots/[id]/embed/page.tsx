import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmbedCodePanel } from "@/components/dashboard/embed-code-panel";

export default async function EmbedPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) notFound();

  const supabase = createServiceClient();
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id, name, widget_color, status")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!chatbot) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/chatbots/${chatbot.id}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {chatbot.name}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Embed Code</h1>
        <p className="text-slate-500 text-sm mt-1">
          Paste this snippet into your website&apos;s HTML to deploy the chat widget.
        </p>
      </div>
      <EmbedCodePanel
        chatbotId={chatbot.id}
        chatbotName={chatbot.name}
        appUrl={appUrl}
        widgetColor={chatbot.widget_color}
      />
    </div>
  );
}
