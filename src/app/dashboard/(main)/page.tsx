import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { LayoutDashboard, Bot, MessageSquare, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

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

  const stats = [
    { label: "Total Chatbots", value: totalChatbots ?? 0, icon: Bot, color: "text-emerald-600", bg: "bg-emerald-50", href: "/dashboard/chatbots" },
    { label: "Total Conversations", value: totalConversations ?? 0, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/conversations" },
    { label: "Open", value: openConversations ?? 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", href: "/dashboard/conversations?status=open" },
    { label: "Escalated", value: escalatedConversations ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", href: "/dashboard/conversations?status=escalated" },
  ];

  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    escalated: "bg-red-100 text-red-700",
    resolved: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-emerald-600" />
          Overview
        </h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Recent Conversations</CardTitle>
              <Link href="/dashboard/conversations" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentConversations && recentConversations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentConversations.map((conv) => (
                  <Link key={conv.id} href={`/dashboard/conversations?id=${conv.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{conv.visitor_name ?? "Anonymous Visitor"}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {(conv as { chatbot?: { name: string } }).chatbot?.name} • {formatRelativeTime(conv.updated_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[conv.status]}`}>{conv.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">No conversations yet. Deploy a chatbot to get started.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Your Chatbots</CardTitle>
              <Link href="/dashboard/chatbots" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Manage →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {chatbots && chatbots.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {chatbots.map((bot) => (
                  <Link key={bot.id} href={`/dashboard/chatbots/${bot.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bot.widget_color ?? "#6366f1" }}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{bot.name}</p>
                      <p className="text-xs text-slate-500 truncate">{bot.description ?? "No description"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${bot.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{bot.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-slate-400 text-sm mb-3">No chatbots created yet.</p>
                <Link href="/dashboard/chatbots/new" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Create your first chatbot →</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(totalConversations ?? 0) > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Resolution Rate</p>
                <p className="text-xs text-slate-500 mt-0.5">{resolvedConversations ?? 0} of {totalConversations ?? 0} conversations resolved</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {totalConversations ? Math.round(((resolvedConversations ?? 0) / totalConversations) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalConversations ? Math.round(((resolvedConversations ?? 0) / totalConversations) * 100) : 0}%` }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
