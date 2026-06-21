import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { KnowledgeBaseManager } from "@/components/dashboard/knowledge-base-manager";

export default async function KnowledgeBasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) notFound();

  const supabase = createServiceClient();

  // Verify chatbot belongs to org
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id, name, widget_color")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!chatbot) notFound();

  // Load existing articles
  const { data: articles } = await supabase
    .from("kb_articles")
    .select("*")
    .eq("chatbot_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/chatbots/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {chatbot.name}
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: chatbot.widget_color ?? "#6366f1" }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Articles the AI uses to answer customer questions accurately.
            </p>
          </div>
        </div>
      </div>

      <KnowledgeBaseManager
        chatbotId={id}
        chatbotName={chatbot.name}
        initialArticles={articles ?? []}
      />
    </div>
  );
}
