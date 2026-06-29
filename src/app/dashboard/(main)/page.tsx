import { requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, Bot, MessageSquare, AlertTriangle, CheckCircle,
  TrendingUp, Zap, Clock, Inbox, ArrowRight, ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  const role = await getUserRole(user.id, orgId);
  const forbidden = searchParams?.error === "forbidden";

  const supabase = createServiceClient();

  const { data: chatbotRows } = await supabase.from("chatbots").select("id").eq("org_id", orgId);
  const chatbotIds = chatbotRows?.map((c) => c.id) ?? [];

  const [
    { count: totalChatbots },
    { count: totalConversations },
    { count: openConversations },
    { count: escalatedConversations },
    { count: resolvedConversations },
    { data: recentConversations },
    { data: chatbots },
  ] = await Promise.all([
    supabase.from("chatbots").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    chatbotIds.length > 0
      ? supabase.from("conversations").select("*", { count: "exact", head: true }).in("chatbot_id", chatbotIds)
      : Promise.resolve({ count: 0 }),
    chatbotIds.length > 0
      ? supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "open").in("chatbot_id", chatbotIds)
      : Promise.resolve({ count: 0 }),
    chatbotIds.length > 0
      ? supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "escalated").in("chatbot_id", chatbotIds)
      : Promise.resolve({ count: 0 }),
    chatbotIds.length > 0
      ? supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "resolved").in("chatbot_id", chatbotIds)
      : Promise.resolve({ count: 0 }),
    chatbotIds.length > 0
      ? supabase.from("conversations").select("*, chatbot:chatbots(name)").in("chatbot_id", chatbotIds).order("updated_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    supabase.from("chatbots").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(4),
  ]);

  // Today count
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const stats = [
    { label: "Total Chatbots",     value: totalChatbots ?? 0,      icon: Bot,          color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", href: "/dashboard/chatbots",                       sub: "deployed bots" },
    { label: "Total Conversations",value: totalConversations ?? 0,  icon: MessageSquare,color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100",    href: "/dashboard/conversations",                  sub: `${openConversations ?? 0} open` },
    { label: "Escalated",          value: escalatedConversations ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50",    border: "border-red-100",     href: "/dashboard/conversations?status=escalated", sub: "need attention" },
    { label: "Resolved",           value: resolvedConversations ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50",  border: "border-green-100",   href: "/dashboard/conversations?status=resolved",  sub: `${totalConversations ? Math.round(((resolvedConversations ?? 0) / totalConversations) * 100) : 0}% rate` },
  ];

  const statusColors: Record<string, string> = {
    open:      "bg-emerald-100 text-emerald-700",
    escalated: "bg-red-100 text-red-700",
    resolved:  "bg-slate-100 text-slate-600",
  };

  /* ── waiting time for unresolved chats ── */
  const urgentChats = (recentConversations ?? []).filter((c) => c.status === "escalated");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Forbidden access banner */}
      {forbidden && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>
            <strong>Access denied.</strong> You don&apos;t have permission to access that page.
            {role === "agent" && " Contact your workspace owner to request elevated access."}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-600" />
            Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening right now.</p>
        </div>
        {urgentChats.length > 0 && (
          <Link href="/dashboard/conversations?status=escalated"
            className="flex items-center gap-2 px-3.5 py-2 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{urgentChats.length} escalated</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const isEscalated = stat.label === "Escalated" && (stat.value as number) > 0;
          return (
          <Link key={stat.label} href={stat.href}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer border h-full ${stat.border}${isEscalated ? " bg-red-50/40" : ""}`}>
              <CardContent className="p-5 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isEscalated && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                      )}
                      <p className={`text-xs ${isEscalated ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                        {isEscalated ? "Needs attention" : stat.sub}
                      </p>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-600" />
                Recent Conversations
              </CardTitle>
              <Link href="/dashboard/conversations" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentConversations && recentConversations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentConversations.map((conv) => (
                  <Link key={conv.id} href={`/dashboard/conversations?id=${conv.id}`}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors group">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: conv.status === "escalated" ? "#ef4444" : conv.status === "open" ? "#10b981" : "#94a3b8" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-emerald-700">
                        {conv.visitor_name ?? "Anonymous Visitor"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {(conv as { chatbot?: { name: string } }).chatbot?.name} · {formatRelativeTime(conv.updated_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[conv.status]}`}>
                      {conv.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">Deploy a chatbot widget to start receiving messages.</p>
                <Link href="/dashboard/chatbots" className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  Go to Chatbots <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600" />
                Your Chatbots
              </CardTitle>
              <Link href="/dashboard/chatbots" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {chatbots && chatbots.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {chatbots.map((bot) => (
                  <Link key={bot.id} href={`/dashboard/chatbots/${bot.id}`}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: bot.widget_color ?? "#6366f1" }}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-emerald-700">{bot.name}</p>
                      <p className="text-xs text-slate-500 truncate">{bot.description ?? "No description"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      bot.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}>{bot.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <Bot className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No chatbots yet</p>
                <p className="text-xs text-slate-400 mt-1">Create your first bot to get started.</p>
                <Link href="/dashboard/chatbots/new"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  Create chatbot <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(totalConversations ?? 0) > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Resolution rate */}
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Resolution Rate</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {resolvedConversations ?? 0} of {totalConversations ?? 0} conversations resolved
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {totalConversations ? Math.round(((resolvedConversations ?? 0) / totalConversations) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${totalConversations ? Math.round(((resolvedConversations ?? 0) / totalConversations) * 100) : 0}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Open queue */}
          <Card className={`border ${(escalatedConversations ?? 0) > 0 ? "border-red-200 bg-red-50/30" : "border-slate-200"}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${(escalatedConversations ?? 0) > 0 ? "bg-red-100" : "bg-amber-50"}`}>
                  {(escalatedConversations ?? 0) > 0
                    ? <AlertTriangle className="w-5 h-5 text-red-600" />
                    : <Clock className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {(escalatedConversations ?? 0) > 0 ? "Needs Attention" : "Active Queue"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(openConversations ?? 0)} open · {(escalatedConversations ?? 0)} escalated
                  </p>
                </div>
                <Link
                  href={(escalatedConversations ?? 0) > 0 ? "/dashboard/conversations?status=escalated" : "/dashboard/conversations?status=open"}
                  className={`flex items-center gap-1 text-xs font-semibold ${(escalatedConversations ?? 0) > 0 ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"}`}
                >
                  View <Zap className="w-3 h-3" />
                </Link>
              </div>
              {(escalatedConversations ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {escalatedConversations} escalated conversation{(escalatedConversations ?? 0) !== 1 ? "s" : ""} waiting
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
