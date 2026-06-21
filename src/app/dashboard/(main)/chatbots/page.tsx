import { requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bot, Plus, Settings, BarChart2, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { DeleteChatbotButton } from "@/components/dashboard/delete-chatbot-button";

export default async function ChatbotsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  // Resolve role — agents can view chatbots but not create/delete
  const role = await getUserRole(user.id, orgId);
  const canCreate = role === "owner" || role === "super_admin";
  const canDelete = role === "owner" || role === "super_admin";

  const supabase = createServiceClient();

  const { data: chatbots } = await supabase
    .from("chatbots")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  // Get conversation counts per chatbot
  const chatbotIds = chatbots?.map((c) => c.id) ?? [];
  const { data: convCounts } = chatbotIds.length > 0
    ? await supabase
        .from("conversations")
        .select("chatbot_id")
        .in("chatbot_id", chatbotIds)
    : { data: [] };

  const countMap: Record<string, number> = {};
  (convCounts ?? []).forEach((c) => {
    countMap[c.chatbot_id] = (countMap[c.chatbot_id] ?? 0) + 1;
  });

  // Get KB article counts per chatbot
  const { data: kbCounts } = chatbotIds.length > 0
    ? await supabase
        .from("kb_articles")
        .select("chatbot_id")
        .in("chatbot_id", chatbotIds)
        .eq("is_published", true)
    : { data: [] };

  const kbMap: Record<string, number> = {};
  (kbCounts ?? []).forEach((k: { chatbot_id: string }) => {
    kbMap[k.chatbot_id] = (kbMap[k.chatbot_id] ?? 0) + 1;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-600" />
            Chatbots
          </h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage your AI support agents.</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/chatbots/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              New Chatbot
            </Button>
          </Link>
        )}
      </div>

      {/* List */}
      {chatbots && chatbots.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chatbots.map((bot) => (
            <Card key={bot.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* Top row */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: bot.widget_color ?? "#6366f1" }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{bot.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{bot.description ?? "No description"}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      bot.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {bot.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {countMap[bot.id] ?? 0} conversations
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {kbMap[bot.id] ?? 0} KB articles
                  </span>
                  <span>Updated {formatRelativeTime(bot.updated_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/chatbots/${bot.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      <Settings className="w-3.5 h-3.5" />
                      Configure
                    </Button>
                  </Link>
                  <Link href={`/dashboard/chatbots/${bot.id}/knowledge`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <BookOpen className="w-3.5 h-3.5" />
                      KB
                    </Button>
                  </Link>
                  <Link href={`/dashboard/chatbots/${bot.id}/embed`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Embed
                    </Button>
                  </Link>
                  {canDelete && <DeleteChatbotButton chatbotId={bot.id} chatbotName={bot.name} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No chatbots yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Create your first AI chatbot and embed it on your website in minutes.
            </p>
            {canCreate && (
              <Link href="/dashboard/chatbots/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Create Chatbot
                </Button>
              </Link>
            )}
            {!canCreate && (
              <p className="text-xs text-slate-400 border border-slate-200 rounded-lg p-3 bg-slate-50">
                Contact your workspace owner to create chatbots.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
