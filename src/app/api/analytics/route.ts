import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrgId } from "@/lib/get-org";

export const runtime = "nodejs";

/**
 * GET /api/analytics?range=7d|30d|90d|all
 *
 * Returns all analytics metrics for the org in one structured response.
 * Used by the analytics dashboard client component for range switching.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = await getOrgId(user.id);
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") ?? "30d";

    const supabase = createServiceClient();

    // Determine cutoff date
    const now = new Date();
    let cutoff: Date | null = null;
    if (range === "7d")  { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7); }
    if (range === "30d") { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30); }
    if (range === "90d") { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 90); }

    // Get chatbot IDs for this org
    const { data: bots } = await supabase.from("chatbots").select("id, name, widget_color, status").eq("org_id", orgId);
    const botIds = bots?.map((b) => b.id) ?? [];

    if (botIds.length === 0) {
      return NextResponse.json({ empty: true, chatbots: [] });
    }

    // Conversations query (scoped to range)
    let convQuery = supabase
      .from("conversations")
      .select("id, chatbot_id, status, message_count, created_at, updated_at, assigned_agent_id, priority, source")
      .in("chatbot_id", botIds);
    if (cutoff) convQuery = convQuery.gte("created_at", cutoff.toISOString());
    const { data: convRows } = await convQuery.order("created_at", { ascending: true });
    const convs = convRows ?? [];

    // All conversation IDs for sub-queries
    const convIds = convs.map((c) => c.id);

    // Messages (for response time)
    let msgRows: Array<{ conversation_id: string; role: string; created_at: string }> = [];
    if (convIds.length > 0) {
      const { data } = await supabase
        .from("messages")
        .select("conversation_id, role, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
        .limit(10000);
      msgRows = data ?? [];
    }

    // AI sessions
    let sessionRows: Array<{ conversation_id: string; intent_label: string | null; escalated_to_human: boolean }> = [];
    if (convIds.length > 0) {
      const { data } = await supabase
        .from("ai_sessions")
        .select("conversation_id, intent_label, escalated_to_human")
        .in("conversation_id", convIds);
      sessionRows = data ?? [];
    }

    // Agent status
    const { data: agentRows } = await supabase
      .from("agent_status")
      .select("agent_id, online_status, active_chat_count, last_active")
      .neq("online_status", "offline");

    // KB article count
    const { count: kbCount } = await supabase
      .from("kb_articles")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_published", true);

    // ── Aggregate ──
    const totalConversations = convs.length;
    const totalMessages      = convs.reduce((s, c) => s + (c.message_count ?? 0), 0);
    const totalOpen          = convs.filter((c) => c.status === "open").length;
    const totalEscalated     = convs.filter((c) => c.status === "escalated").length;
    const totalResolved      = convs.filter((c) => c.status === "resolved").length;
    const totalAssigned      = convs.filter((c) => c.assigned_agent_id).length;
    const highPriority       = convs.filter((c) => c.priority === "high").length;

    // Today
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayChats = convs.filter((c) => new Date(c.created_at) >= todayStart).length;

    // First response time
    const firstResponseTimes: number[] = [];
    if (msgRows.length > 0) {
      const byConv: Record<string, typeof msgRows> = {};
      msgRows.forEach((m) => { (byConv[m.conversation_id] ??= []).push(m); });
      Object.values(byConv).forEach((msgs) => {
        const firstUser  = msgs.find((m) => m.role === "user");
        const firstReply = msgs.find((m) => m.role !== "user" && new Date(m.created_at) > new Date(firstUser?.created_at ?? 0));
        if (firstUser && firstReply) {
          const diff = new Date(firstReply.created_at).getTime() - new Date(firstUser.created_at).getTime();
          if (diff > 0) firstResponseTimes.push(diff);
        }
      });
    }
    const avgFirstResponseMin = firstResponseTimes.length > 0
      ? Math.round(firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length / 1000 / 60)
      : 0;

    // Avg session length
    const totalSessionMs = convs.reduce((s, c) => {
      const diff = new Date(c.updated_at).getTime() - new Date(c.created_at).getTime();
      return s + (diff > 0 ? diff : 0);
    }, 0);
    const avgSessionMin = totalConversations > 0
      ? Math.round(totalSessionMs / totalConversations / 1000 / 60)
      : 0;

    // Daily chart — use range to determine how many days
    const chartDays = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 30;
    const dailyData: Array<{ label: string; date: string; count: number; resolved: number; escalated: number }> = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayConvs = convs.filter((c) => new Date(c.created_at) >= dayStart && new Date(c.created_at) <= dayEnd);
      const label = i === 0 ? "Today" : chartDays <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyData.push({
        label,
        date: d.toISOString().split("T")[0],
        count:     dayConvs.length,
        resolved:  dayConvs.filter((c) => c.status === "resolved").length,
        escalated: dayConvs.filter((c) => c.status === "escalated").length,
      });
    }

    // Hourly heatmap — hour 0-23
    const hourlyData: number[] = new Array(24).fill(0);
    convs.forEach((c) => { hourlyData[new Date(c.created_at).getHours()]++; });

    // Per-chatbot stats
    const botStats = (bots ?? []).map((bot) => {
      const bc = convs.filter((c) => c.chatbot_id === bot.id);
      return {
        id:         bot.id,
        name:       bot.name,
        color:      bot.widget_color,
        status:     bot.status,
        total:      bc.length,
        open:       bc.filter((c) => c.status === "open").length,
        escalated:  bc.filter((c) => c.status === "escalated").length,
        resolved:   bc.filter((c) => c.status === "resolved").length,
        messages:   bc.reduce((s, c) => s + (c.message_count ?? 0), 0),
      };
    }).sort((a, b) => b.total - a.total);

    // AI vs human
    const aiHandled    = sessionRows.filter((s) => !s.escalated_to_human).length;
    const humanHandled = sessionRows.filter((s) => s.escalated_to_human).length;

    // Intent breakdown
    const intentMap: Record<string, number> = {};
    sessionRows.forEach((s) => {
      if (s.intent_label) intentMap[s.intent_label] = (intentMap[s.intent_label] ?? 0) + 1;
    });
    const topIntents = Object.entries(intentMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));

    // Agent workload
    const agents = (agentRows ?? []).map((a) => ({
      agentId:        a.agent_id,
      onlineStatus:   a.online_status,
      activeChatCount: a.active_chat_count ?? 0,
      lastActive:     a.last_active,
    }));

    return NextResponse.json({
      range,
      totalConversations,
      totalMessages,
      totalOpen,
      totalEscalated,
      totalResolved,
      totalAssigned,
      highPriority,
      todayChats,
      avgFirstResponseMin,
      avgSessionMin,
      resolutionRate:  totalConversations > 0 ? Math.round((totalResolved  / totalConversations) * 100) : 0,
      escalationRate:  totalConversations > 0 ? Math.round((totalEscalated / totalConversations) * 100) : 0,
      avgMsgsPerConv:  totalConversations > 0 ? +(totalMessages / totalConversations).toFixed(1) : 0,
      dailyData,
      hourlyData,
      botStats,
      aiHandled,
      humanHandled,
      topIntents,
      agents,
      kbCount:         kbCount ?? 0,
      sessionCount:    sessionRows.length,
      generatedAt:     now.toISOString(),
    });
  } catch (err) {
    console.error("Analytics API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
