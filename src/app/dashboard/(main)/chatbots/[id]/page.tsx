import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatbotForm } from "@/components/dashboard/chatbot-form";
import type { Chatbot } from "@/types";

export default async function EditChatbotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) notFound();

  const supabase = createServiceClient();
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!chatbot) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/chatbots"
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Chatbots
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{chatbot.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Configure your chatbot settings.</p>
        </div>
        <Link href={`/dashboard/chatbots/${chatbot.id}/embed`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Embed Code
          </Button>
        </Link>
      </div>
      <ChatbotForm orgId={orgId} chatbot={chatbot as Chatbot} />
    </div>
  );
}
