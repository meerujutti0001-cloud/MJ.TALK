import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import {
  BarChart2, MessageSquare, Bot, TrendingUp,
  AlertTriangle, CheckCircle2, Users, Zap, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/* ─── helper ─── */
function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default async function AnalyticsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  const supabase = createServiceClient();

  const [{ data: chatbots }, { data: conversations }] = await Promise.all([
    supabase
      .from("chatbots")
      .select("id, name, widget_color, status, created_at")
      .eq("org_id", orgId),
    (async () => {
      const ids = (await supabase.from("chatbots").select("id").eq("org_id", orgId)).data?.map((c) => c.id) ?? [];
      if (ids.length === 0) return { data: [] };
      return supabase
        .from("conversations")
        .select("id, chatbot_id, status, message_count, created_at, updated_at")
        .in("chatbot_id", ids)
        .order("created_at", { ascending: true });
    })(),
  ]);

  /* ── aggregate totals ── */
  const convs = conversations ?? [];
  const totalConversations = convs.length;
  const totalMessages = convs.reduce((s, c) => s + (c.message_count ?? 0), 0);
  const totalEscalated  = convs.filter((c) => c.status === "escalated").length;
  const totalResolved   = convs.filter((c) => c.status === "resolved").length;
  const totalOpen       = convs.filter((c) => c.status === "open").length;
  const resolutionRate  = pct(totalResolved, totalConversations);
  const escalationRate  = pct(totalEscalated, totalConversations);
  const avgMsgsPerConv  = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : "0";
  
  // Calculate average session length (in minutes)
  const totalSessionTime = convs.reduce((sum, c) => {
    const start = new Date(c.created_at).getTime();
    const end = new Date(c.updated_at).getTime();
    return sum + (end - start);
  }, 0);
  const avgSessionMinutes = totalConversations > 0 
    ? Math.round(totalSessionTime / totalConversations / 1000 / 60) 
    : 0;

  /* ── per-chatbot stats ── */
  const statsMap: Record<string, {
    total: number; open: number; escalated: number;
    resolved: number; totalMessages: number;
  }> = {};
  (chatbots ?? []).forEach((b) => {
    statsMap[b.id] = { total: 0, open: 0, escalated: 0, resolved: 0, totalMessages: 0 };
  });
  convs.forEach((c) => {
    if (!statsMap[c.chatbot_id]) return;
    statsMap[c.chatbot_id].total++;
    statsMap[c.chatbot_id][c.status as "open" | "escalated" | "resolved"]++;
    statsMap[c.chatbot_id].totalMessages += c.message_count ?? 0;
  });

  /* ── last 7 days activity ── */
  const days: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayStart = new Date(d.setHours(0, 0, 0, 0)).toISOString();
    const dayEnd   = new Date(d.setHours(23, 59, 59, 999)).toISOString();
    const count = convs.filter(
      (c) => c.created_at >= dayStart && c.created_at <= dayEnd
    ).length;
    days.push({ label, count });
  }
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-emerald-600" />
          Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-1">Performance overview for all your chatbots.</p>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Conversations", value: totalConversations, sub: `${totalOpen} open`, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Total Messages", value: totalMessages, sub: `~${avgMsgsPerConv} per chat`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Avg Session", value: `${avgSessionMinutes}m`, sub: totalConversations > 0 ? "average length" : "no data", icon: Clock, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
          { label: "Escalated", value: totalEscalated, sub: `${escalationRate}% rate`, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
          { label: "Resolved", value: totalResolved, sub: `${resolutionRate}% rate`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.border} shadow-sm`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Two-column: chart + donut ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* 7-day bar chart */}
        <Card className="border-slate-200 lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Conversations — Last 7 Days
              </CardTitle>
              <span className="text-xs text-slate-400">{totalConversations} total</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32 mt-2">
              {days.map((d, i) => {
                const h = Math.max(4, Math.round((d.count / maxDay) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400 font-medium tabular-nums">
                      {d.count > 0 ? d.count : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-emerald-500 transition-all hover:bg-emerald-600"
                      style={{ height: `${h}%`, minHeight: "4px" }}
                      title={`${d.count} conversations`}
                    />
                    <span className="text-xs text-slate-400">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalConversations === 0 ? (
              <p className="text-center text-slate-300 text-sm py-8">No data yet</p>
            ) : (
              <div className="space-y-3 mt-2">
                {[
                  { label: "Open", count: totalOpen, color: "bg-emerald-500", text: "text-emerald-600" },
                  { label: "Escalated", count: totalEscalated, color: "bg-red-500", text: "text-red-600" },
                  { label: "Resolved", count: totalResolved, color: "bg-slate-400", text: "text-slate-500" },
                ].map(({ label, count, color, text }) => {
                  const p = pct(count, totalConversations);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className={`font-semibold ${text}`}>{count} ({p}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Resolution rate callout */}
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-700 mb-0.5">Resolution Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">{resolutionRate}%</p>
                  <p className="text-xs text-emerald-600 mt-0.5">{totalResolved} of {totalConversations} resolved</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Per-chatbot breakdown ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-500" />
              Per-Chatbot Breakdown
            </CardTitle>
            <Link href="/dashboard/chatbots" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              Manage bots →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {chatbots && chatbots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chatbot</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Open</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Escalated</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Msgs</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {chatbots.map((bot) => {
                    const s = statsMap[bot.id] ?? { total: 0, open: 0, escalated: 0, resolved: 0, totalMessages: 0 };
                    const avg   = s.total > 0 ? (s.totalMessages / s.total).toFixed(1) : "0";
                    const resPct = pct(s.resolved, s.total);
                    return (
                      <tr key={bot.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/chatbots/${bot.id}`} className="flex items-center gap-2.5 hover:text-emerald-600 group">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: bot.widget_color ?? "#6366f1" }}
                            >
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-slate-800 group-hover:text-emerald-600">{bot.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900">{s.total}</td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-emerald-600 font-semibold">{s.open}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={s.escalated > 0 ? "text-red-600 font-semibold" : "text-slate-400"}>{s.escalated}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-slate-600 font-medium">{s.resolved}</span>
                        </td>
                        <td className="px-4 py-4 text-right text-slate-500 font-medium">{avg}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${resPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-500 tabular-nums">{resPct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            bot.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
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
            <div className="p-10 text-center">
              <Bot className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No chatbots yet.</p>
              <Link href="/dashboard/chatbots/new" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-1 inline-block">
                Create your first bot →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
