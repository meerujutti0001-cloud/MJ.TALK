import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import {
  BarChart2, MessageSquare, Bot, TrendingUp,
  AlertTriangle, CheckCircle2, Users, Zap, Clock,
  Activity, ArrowUpRight, Inbox, BookOpen, Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function AnalyticsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  const supabase = createServiceClient();

  const [{ data: chatbots }, { data: conversations }, { data: allMessages }, { data: aiSessions }] = await Promise.all([    supabase
      .from("chatbots")
      .select("id, name, widget_color, status, created_at")
      .eq("org_id", orgId),
    (async () => {
      const ids = (await supabase.from("chatbots").select("id").eq("org_id", orgId)).data?.map((c) => c.id) ?? [];
      if (ids.length === 0) return { data: [] };
      return supabase
        .from("conversations")
        .select("id, chatbot_id, status, message_count, created_at, updated_at, assigned_agent_id, priority, source")
        .in("chatbot_id", ids)
        .order("created_at", { ascending: true });
    })(),
    (async () => {
      const ids = (await supabase.from("chatbots").select("id").eq("org_id", orgId)).data?.map((c) => c.id) ?? [];
      if (ids.length === 0) return { data: [] };
      const convIds = (await supabase.from("conversations").select("id").in("chatbot_id", ids)).data?.map((c) => c.id) ?? [];
      if (convIds.length === 0) return { data: [] };
      return supabase
        .from("messages")
        .select("id, conversation_id, role, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
        .limit(5000);
    })(),
    (async () => {
      const ids = (await supabase.from("chatbots").select("id").eq("org_id", orgId)).data?.map((c) => c.id) ?? [];
      if (ids.length === 0) return { data: [] };
      const convIds = (await supabase.from("conversations").select("id").in("chatbot_id", ids)).data?.map((c) => c.id) ?? [];
      if (convIds.length === 0) return { data: [] };
      return supabase
        .from("ai_sessions")
        .select("conversation_id, intent_label, escalated_to_human, intent_confidence")
        .in("conversation_id", convIds);
    })(),
  ]);

  /* ── aggregate totals ── */
  const convs = conversations ?? [];
  const msgs = allMessages ?? [];
  const totalConversations = convs.length;
  const totalMessages = convs.reduce((s, c) => s + (c.message_count ?? 0), 0);
  const totalEscalated  = convs.filter((c) => c.status === "escalated").length;
  const totalResolved   = convs.filter((c) => c.status === "resolved").length;
  const totalOpen       = convs.filter((c) => c.status === "open").length;
  const totalAssigned   = convs.filter((c) => c.assigned_agent_id).length;
  const highPriority    = convs.filter((c) => c.priority === "high").length;
  const resolutionRate  = pct(totalResolved, totalConversations);
  const escalationRate  = pct(totalEscalated, totalConversations);
  const avgMsgsPerConv  = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : "0";

  /* ── Average first response time (time from first user msg to first admin/assistant reply) ── */
  const firstResponseTimes: number[] = [];
  if (msgs.length > 0) {
    const msgsByConv: Record<string, typeof msgs> = {};
    msgs.forEach((m) => {
      if (!msgsByConv[m.conversation_id]) msgsByConv[m.conversation_id] = [];
      msgsByConv[m.conversation_id].push(m);
    });
    Object.values(msgsByConv).forEach((convMsgs) => {
      const firstUser = convMsgs.find((m) => m.role === "user");
      const firstReply = convMsgs.find((m) => m.role !== "user" && new Date(m.created_at) > new Date(firstUser?.created_at ?? 0));
      if (firstUser && firstReply) {
        const diffMs = new Date(firstReply.created_at).getTime() - new Date(firstUser.created_at).getTime();
        if (diffMs > 0) firstResponseTimes.push(diffMs);
      }
    });
  }
  const avgFirstResponseMin = firstResponseTimes.length > 0
    ? Math.round(firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length / 1000 / 60)
    : 0;

  /* ── Average session length ── */
  const totalSessionTime = convs.reduce((sum, c) => {
    const start = new Date(c.created_at).getTime();
    const end = new Date(c.updated_at).getTime();
    return sum + (end - start);
  }, 0);
  const avgSessionMinutes = totalConversations > 0
    ? Math.round(totalSessionTime / totalConversations / 1000 / 60)
    : 0;

  /* ── Today's chats ── */
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayChats = convs.filter((c) => new Date(c.created_at) >= todayStart).length;

  /* ── Per-chatbot stats ── */
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

  /* ── Last 7 days activity ── */
  const days: { label: string; date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const count = convs.filter(
      (c) => new Date(c.created_at) >= dayStart && new Date(c.created_at) <= dayEnd
    ).length;
    days.push({ label, date: d.toISOString().split("T")[0], count });
  }
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  /* ── Source breakdown ── */
  const sourceMap: Record<string, number> = {};
  convs.forEach((c) => { const s = c.source ?? "widget"; sourceMap[s] = (sourceMap[s] ?? 0) + 1; });

  /* ── AI session metrics ── */
  const sessions = aiSessions ?? [];
  const aiHandled    = sessions.filter((s) => !s.escalated_to_human).length;
  const humanHandled = sessions.filter((s) => s.escalated_to_human).length;

  // Intent breakdown
  const intentMap: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.intent_label) {
      intentMap[s.intent_label] = (intentMap[s.intent_label] ?? 0) + 1;
    }
  });
  const topIntents = Object.entries(intentMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // KB articles count
  const { count: kbCount } = await supabase
    .from("kb_articles")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("is_published", true);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-emerald-600" />
            Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time performance data for all your chatbots.</p>
        </div>
        {todayChats > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">{todayChats} chats today</span>
          </div>
        )}
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Conversations", value: totalConversations,
            sub: `${todayChats} today`, icon: MessageSquare,
            color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100",
            href: "/dashboard/conversations",
          },
          {
            label: "Open Chats", value: totalOpen,
            sub: totalAssigned > 0 ? `${totalAssigned} assigned` : "unassigned",
            icon: Inbox, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100",
            href: "/dashboard/conversations?status=open",
          },
          {
            label: "Avg. First Response", value: formatDuration(avgFirstResponseMin),
            sub: firstResponseTimes.length > 0 ? `from ${firstResponseTimes.length} chats` : "no data yet",
            icon: Clock, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100",
            href: null,
          },
          {
            label: "Resolution Rate", value: `${resolutionRate}%`,
            sub: `${totalResolved} of ${totalConversations} resolved`,
            icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-100",
            href: "/dashboard/conversations?status=resolved",
          },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.border} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-5">
              {s.href ? (
                <Link href={s.href} className="block">
                  <StatCardInner s={s} />
                </Link>
              ) : (
                <StatCardInner s={s} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Secondary metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Messages", value: totalMessages, sub: `~${avgMsgsPerConv} / chat`, icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50" },
          { label: "Escalated", value: totalEscalated, sub: `${escalationRate}% rate`, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
          { label: "Avg. Session", value: formatDuration(avgSessionMinutes), sub: "time per chat", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "High Priority", value: highPriority, sub: `${pct(highPriority, totalConversations)}% of all`, icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900 leading-tight">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Two-column: chart + distribution ── */}
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
            <div className="flex items-end gap-2 h-36 mt-2">
              {days.map((d, i) => {
                const h = Math.max(4, Math.round((d.count / maxDay) * 100));
                const isToday = d.label === "Today";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    {d.count > 0 && (
                      <span className="text-xs text-slate-500 font-semibold tabular-nums">{d.count}</span>
                    )}
                    <div
                      className={`w-full rounded-t-lg transition-all ${isToday ? "bg-emerald-500" : "bg-emerald-200 hover:bg-emerald-400"}`}
                      style={{ height: `${h}%`, minHeight: "4px" }}
                      title={`${d.count} conversation${d.count !== 1 ? "s" : ""} on ${d.label}`}
                    />
                    <span className={`text-xs ${isToday ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {d.label}
                    </span>
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
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-medium">No data yet</p>
                <p className="text-xs text-slate-300 mt-1">Start conversations to see stats</p>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {[
                  { label: "Open",      count: totalOpen,       color: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-400" },
                  { label: "Escalated", count: totalEscalated,  color: "bg-red-500",     text: "text-red-600",     dot: "bg-red-400" },
                  { label: "Resolved",  count: totalResolved,   color: "bg-slate-400",   text: "text-slate-500",   dot: "bg-slate-300" },
                ].map(({ label, count, color, text, dot }) => {
                  const p = pct(count, totalConversations);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1 items-center">
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          {label}
                        </span>
                        <span className={`font-semibold ${text}`}>{count} <span className="text-slate-400 font-normal">({p}%)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-700 mb-0.5">Resolution Rate</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-emerald-600">{resolutionRate}%</p>
                    {resolutionRate >= 70 && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-emerald-600 mt-0.5">{totalResolved} of {totalConversations} resolved</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── AI + Knowledge Base Section ── */}
      {sessions.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* AI vs Human resolution */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                AI vs Human Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "AI Resolved",    count: aiHandled,    color: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-400" },
                { label: "Human Handoff",  count: humanHandled, color: "bg-amber-500",   text: "text-amber-600",  dot: "bg-amber-400" },
              ].map(({ label, count, color, text, dot }) => {
                const total = aiHandled + humanHandled;
                const p = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1 items-center">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className={`w-2 h-2 rounded-full ${dot}`} />
                        {label}
                      </span>
                      <span className={`font-semibold ${text}`}>
                        {count} <span className="text-slate-400 font-normal">({p}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
                <Activity className="w-3.5 h-3.5" />
                {sessions.length} total sessions tracked
                {(kbCount ?? 0) > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-emerald-600 font-medium">
                    <BookOpen className="w-3 h-3" />
                    {kbCount} KB articles active
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Intent breakdown */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Top Customer Intents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topIntents.length === 0 ? (
                <div className="text-center py-6">
                  <Brain className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No intent data yet</p>
                  <p className="text-xs text-slate-300 mt-0.5">Intent detection starts automatically on new chats.</p>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {topIntents.map(([label, count]) => {
                    const p = sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0;
                    const colors: Record<string, string> = {
                      refund: "bg-amber-500", billing: "bg-emerald-500",
                      account: "bg-purple-500", technical: "bg-red-500",
                      complaint: "bg-orange-500", setup: "bg-indigo-500",
                      general: "bg-slate-400", other: "bg-slate-300",
                    };
                    const textColors: Record<string, string> = {
                      refund: "text-amber-600", billing: "text-emerald-600",
                      account: "text-purple-600", technical: "text-red-600",
                      complaint: "text-orange-600", setup: "text-indigo-600",
                      general: "text-slate-500", other: "text-slate-400",
                    };
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`capitalize font-medium ${textColors[label] ?? "text-slate-600"}`}>{label}</span>
                          <span className="text-slate-400">{count} ({p}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[label] ?? "bg-slate-400"} rounded-full`}
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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
                    {["Chatbot", "Total", "Open", "Escalated", "Resolved", "Avg Msgs", "Resolution", "Status"].map((h, i) => (
                      <th key={h} className={`py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 0 ? "text-left px-6" : i === 7 ? "text-right px-6" : "text-right px-4"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(chatbots ?? []).sort((a, b) => (statsMap[b.id]?.total ?? 0) - (statsMap[a.id]?.total ?? 0)).map((bot) => {
                    const s = statsMap[bot.id] ?? { total: 0, open: 0, escalated: 0, resolved: 0, totalMessages: 0 };
                    const avg = s.total > 0 ? (s.totalMessages / s.total).toFixed(1) : "0";
                    const resPct = pct(s.resolved, s.total);
                    return (
                      <tr key={bot.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/chatbots/${bot.id}`} className="flex items-center gap-2.5 hover:text-emerald-600 group">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: bot.widget_color ?? "#6366f1" }}>
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-slate-800 group-hover:text-emerald-600">{bot.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900">{s.total}</td>
                        <td className="px-4 py-4 text-right"><span className="text-emerald-600 font-semibold">{s.open}</span></td>
                        <td className="px-4 py-4 text-right">
                          {s.escalated > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                              <AlertTriangle className="w-3 h-3" />{s.escalated}
                            </span>
                          ) : <span className="text-slate-300">0</span>}
                        </td>
                        <td className="px-4 py-4 text-right"><span className="text-slate-600 font-medium">{s.resolved}</span></td>
                        <td className="px-4 py-4 text-right text-slate-500 font-medium">{avg}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resPct}%` }} />
                            </div>
                            <span className="text-xs font-medium text-slate-500 tabular-nums">{resPct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${bot.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
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
              <p className="text-slate-400 text-sm font-medium">No chatbots yet</p>
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

/* ── Extracted to avoid JSX in object literals ── */
function StatCardInner({ s }: { s: { label: string; value: string | number; sub: string; icon: React.ElementType; color: string; bg: string } }) {
  return (
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
  );
}
