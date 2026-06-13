import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { BarChart2, MessageSquare, Bot, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AnalyticsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  const supabase = createServiceClient();

  const { data: chatbots } = await supabase
    .from("chatbots")
    .select("id, name, widget_color, status, created_at")
    .eq("org_id", orgId);

  const chatbotIds = chatbots?.map((c) => c.id) ?? [];

  const { data: conversations } = chatbotIds.length > 0
    ? await supabase
        .from("conversations")
        .select("id, chatbot_id, status, message_count, created_at")
        .in("chatbot_id", chatbotIds)
    : { data: [] };

  // Build per-chatbot stats
  const statsMap: Record<string, {
    total: number;
    open: number;
    escalated: number;
    resolved: number;
    totalMessages: number;
  }> = {};

  chatbotIds.forEach((id) => {
    statsMap[id] = { total: 0, open: 0, escalated: 0, resolved: 0, totalMessages: 0 };
  });

  (conversations ?? []).forEach((c) => {
    if (!statsMap[c.chatbot_id]) return;
    statsMap[c.chatbot_id].total++;
    statsMap[c.chatbot_id][c.status as "open" | "escalated" | "resolved"]++;
    statsMap[c.chatbot_id].totalMessages += c.message_count ?? 0;
  });

  const totalConversations = (conversations ?? []).length;
  const totalMessages = (conversations ?? []).reduce((sum, c) => sum + (c.message_count ?? 0), 0);
  const totalEscalated = (conversations ?? []).filter((c) => c.status === "escalated").length;
  const totalResolved = (conversations ?? []).filter((c) => c.status === "resolved").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-emerald-600" />
          Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-1">Performance overview for all your chatbots.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Conversations", value: totalConversations, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Messages", value: totalMessages, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Escalated", value: totalEscalated, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
          { label: "Resolved", value: totalResolved, icon: Bot, color: "text-green-600", bg: "bg-green-50" },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-chatbot breakdown */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Per-Chatbot Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {chatbots && chatbots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chatbot</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Open</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Escalated</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Msgs</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chatbots.map((bot) => {
                    const s = statsMap[bot.id] ?? { total: 0, open: 0, escalated: 0, resolved: 0, totalMessages: 0 };
                    const avg = s.total > 0 ? (s.totalMessages / s.total).toFixed(1) : "0";
                    return (
                      <tr key={bot.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/chatbots/${bot.id}`} className="flex items-center gap-2 hover:text-emerald-600">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: bot.widget_color ?? "#6366f1" }}
                            >
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-medium text-slate-800">{bot.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-slate-900">{s.total}</td>
                        <td className="px-4 py-4 text-right text-green-600 font-medium">{s.open}</td>
                        <td className="px-4 py-4 text-right text-red-600 font-medium">{s.escalated}</td>
                        <td className="px-4 py-4 text-right text-slate-600 font-medium">{s.resolved}</td>
                        <td className="px-4 py-4 text-right text-slate-500">{avg}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            bot.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {bot.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              No chatbots found. <Link href="/dashboard/chatbots/new" className="text-emerald-600 hover:underline">Create one</Link>.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
