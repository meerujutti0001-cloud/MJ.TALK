"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart2, MessageSquare, Bot, TrendingUp, AlertTriangle,
  CheckCircle2, Users, Zap, Clock, Activity, ArrowUpRight,
  Inbox, BookOpen, Brain, RefreshCw, Download, Calendar,
  UserCheck, Wifi, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
type Range = "today" | "7d" | "30d" | "90d" | "all";

interface DailyPoint {
  label: string; date: string;
  count: number; resolved: number; escalated: number;
}

interface BotStat {
  id: string; name: string; color: string; status: string;
  total: number; open: number; escalated: number; resolved: number; messages: number;
}

interface IntentItem { label: string; count: number; }

interface AgentItem {
  agentId: string; onlineStatus: string;
  activeChatCount: number; lastActive: string;
}

interface AnalyticsData {
  range: string;
  totalConversations: number; totalMessages: number;
  totalOpen: number; totalEscalated: number; totalResolved: number;
  totalAssigned: number; highPriority: number; todayChats: number;
  avgFirstResponseMin: number; avgSessionMin: number;
  resolutionRate: number; escalationRate: number; avgMsgsPerConv: number;
  dailyData: DailyPoint[];
  hourlyData: number[];
  botStats: BotStat[];
  aiHandled: number; humanHandled: number;
  topIntents: IntentItem[];
  agents: AgentItem[];
  kbCount: number; sessionCount: number;
  generatedAt: string;
}

/* ─── Helpers ─── */
function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
function fmtDuration(min: number): string {
  if (min < 1) return "< 1m";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Color maps ─── */
const INTENT_BAR: Record<string, string> = {
  refund: "bg-amber-500", billing: "bg-emerald-500",
  account: "bg-purple-500", technical: "bg-red-500",
  complaint: "bg-orange-500", setup: "bg-indigo-500",
  general: "bg-slate-400", other: "bg-slate-300",
};
const INTENT_TEXT: Record<string, string> = {
  refund: "text-amber-600", billing: "text-emerald-600",
  account: "text-purple-600", technical: "text-red-600",
  complaint: "text-orange-600", setup: "text-indigo-600",
  general: "text-slate-500", other: "text-slate-400",
};
const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-400", away: "bg-amber-400",
  busy: "bg-red-400", offline: "bg-slate-300",
};

/* ─── CSV export ─── */
function exportCSV(data: AnalyticsData) {
  const rows = [
    ["Metric", "Value"],
    ["Total Conversations", data.totalConversations],
    ["Total Messages", data.totalMessages],
    ["Open", data.totalOpen],
    ["Escalated", data.totalEscalated],
    ["Resolved", data.totalResolved],
    ["Resolution Rate (%)", data.resolutionRate],
    ["Escalation Rate (%)", data.escalationRate],
    ["Avg First Response (min)", data.avgFirstResponseMin],
    ["Avg Session (min)", data.avgSessionMin],
    ["Avg Messages / Chat", data.avgMsgsPerConv],
    [],
    ["Date", "Conversations", "Resolved", "Escalated"],
    ...data.dailyData.map((d) => [d.date, d.count, d.resolved, d.escalated]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url;
  a.download = `mjtalk-analytics-${data.range}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════
    MAIN COMPONENT
═══════════════════════════════════════════════════ */
export function AnalyticsDashboard() {
  const [range, setRange]   = useState<Range>("30d");
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const apiRange = r === "today" ? "7d" : r;
      const res = await fetch(`/api/analytics?range=${apiRange}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.empty) { setData(null); return; }
      // For "today" filter, post-filter dailyData to just today
      if (r === "today") {
        const today = new Date().toISOString().split("T")[0];
        json.dailyData = json.dailyData.filter((d: DailyPoint) => d.date === today || d.label === "Today");
      }
      setData(json);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const RANGES: Array<{ value: Range; label: string }> = [
    { value: "today", label: "Today" },
    { value: "7d",    label: "7 days" },
    { value: "30d",   label: "30 days" },
    { value: "90d",   label: "90 days" },
    { value: "all",   label: "All time" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-emerald-600" />
            Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real metrics from your database.{" "}
            {lastFetched && (
              <span className="text-slate-400">
                Updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Range selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  range === r.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >{r.label}</button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchData(range)}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>

          {/* Export CSV */}
          {data && (
            <button
              onClick={() => exportCSV(data)}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />Export CSV
            </button>
          )}
        </div>
      </div>

      {/* ── Loading / error / empty ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mr-3" />
          <span className="text-slate-400 text-sm">Loading analytics…</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => fetchData(range)} className="ml-auto text-xs text-red-600 font-medium underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !data && (
        <div className="text-center py-20">
          <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No data yet</p>
          <p className="text-slate-300 text-sm mt-1">Create chatbots and start conversations to see analytics.</p>
          <Link href="/dashboard/chatbots/new" className="mt-4 inline-block text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Create your first chatbot →
          </Link>
        </div>
      )}

      {!loading && !error && data && <AnalyticsContent data={data} range={range} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
    ANALYTICS CONTENT — renders after data loads
═══════════════════════════════════════════════════ */
function AnalyticsContent({ data, range }: { data: AnalyticsData; range: Range }) {
  const maxDay  = Math.max(...data.dailyData.map((d) => d.count), 1);
  const maxHour = Math.max(...data.hourlyData, 1);

  return (
    <div className="space-y-6">

      {/* ── Today badge ── */}
      {data.todayChats > 0 && range !== "today" && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl w-fit">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">{data.todayChats} new chats today</span>
        </div>
      )}

      {/* ── Primary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Conversations", value: data.totalConversations, sub: `${data.todayChats} today`, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", href: "/dashboard/conversations" },
          { label: "Open Now",            value: data.totalOpen,          sub: data.totalAssigned > 0 ? `${data.totalAssigned} assigned` : "all unassigned", icon: Inbox, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", href: "/dashboard/conversations?status=open" },
          { label: "Avg. First Response", value: fmtDuration(data.avgFirstResponseMin), sub: "time to first reply", icon: Clock, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", href: null },
          { label: "Resolution Rate",     value: `${data.resolutionRate}%`, sub: `${data.totalResolved} of ${data.totalConversations} resolved`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", href: "/dashboard/conversations?status=resolved" },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.border} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-5">
              {s.href ? (
                <Link href={s.href} className="block">
                  <KpiInner s={s} />
                </Link>
              ) : <KpiInner s={s} />}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Secondary metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Messages",       value: data.totalMessages,          sub: `~${data.avgMsgsPerConv}/chat`,         icon: TrendingUp,    color: "text-sky-600",    bg: "bg-sky-50" },
          { label: "Escalated",      value: data.totalEscalated,         sub: `${data.escalationRate}% rate`,          icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-50" },
          { label: "Avg Session",    value: fmtDuration(data.avgSessionMin), sub: "per chat",                         icon: Clock,         color: "text-amber-600",  bg: "bg-amber-50" },
          { label: "High Priority",  value: data.highPriority,           sub: `${pct(data.highPriority, data.totalConversations)}% of all`, icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "KB Articles",    value: data.kbCount,                sub: "published",                             icon: BookOpen,      color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "AI Sessions",    value: data.sessionCount,           sub: `${data.aiHandled} AI resolved`,        icon: Brain,         color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-3.5 flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">{s.label}</p>
                <p className="text-lg font-bold text-slate-900 leading-tight">{s.value}</p>
                <p className="text-xs text-slate-400 truncate">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Trend chart + status distribution ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Trend chart */}
        <Card className="border-slate-200 lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Conversations — {range === "today" ? "Today" : range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : range === "90d" ? "Last 90 Days" : "All Time"}
              </CardTitle>
              <span className="text-xs text-slate-400">{data.totalConversations} total</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "flex items-end gap-1 h-36 mt-2",
              data.dailyData.length > 14 && "gap-0.5"
            )}>
              {data.dailyData.map((d, i) => {
                const h = Math.max(4, Math.round((d.count / maxDay) * 100));
                const isToday = d.label === "Today";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative min-w-0">
                    {d.count > 0 && data.dailyData.length <= 14 && (
                      <span className="text-xs text-slate-500 font-semibold tabular-nums">{d.count}</span>
                    )}
                    {/* Stacked bar: resolved (dark) + open (light) */}
                    <div className="w-full flex flex-col items-stretch justify-end" style={{ height: `${h}%`, minHeight: "4px" }}>
                      <div
                        className={cn("w-full rounded-t-sm transition-all", isToday ? "bg-emerald-500" : "bg-emerald-300 group-hover:bg-emerald-400")}
                        style={{ flex: 1 }}
                        title={`${d.count} conversation${d.count !== 1 ? "s" : ""} on ${d.label}`}
                      />
                    </div>
                    {data.dailyData.length <= 14 && (
                      <span className={cn("text-xs truncate w-full text-center", isToday ? "text-emerald-600 font-semibold" : "text-slate-400")}>
                        {d.label}
                      </span>
                    )}
                    {/* Tooltip on hover for dense charts */}
                    {data.dailyData.length > 14 && d.count > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {d.label}: {d.count}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {data.dailyData.length > 14 && (
              <div className="flex justify-between mt-1 text-xs text-slate-400">
                <span>{data.dailyData[0]?.label}</span>
                <span>{data.dailyData[data.dailyData.length - 1]?.label}</span>
              </div>
            )}
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
            {data.totalConversations === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-medium">No data yet</p>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {[
                  { label: "Open",      count: data.totalOpen,      color: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-400" },
                  { label: "Escalated", count: data.totalEscalated, color: "bg-red-500",     text: "text-red-600",     dot: "bg-red-400" },
                  { label: "Resolved",  count: data.totalResolved,  color: "bg-slate-400",   text: "text-slate-500",   dot: "bg-slate-300" },
                ].map(({ label, count, color, text, dot }) => {
                  const p = pct(count, data.totalConversations);
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
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-700 mb-0.5">Resolution Rate</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-emerald-600">{data.resolutionRate}%</p>
                    {data.resolutionRate >= 70 && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-emerald-600 mt-0.5">{data.totalResolved} of {data.totalConversations} resolved</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Peak hours heatmap ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Peak Hours — When Customers Chat
            </CardTitle>
            <span className="text-xs text-slate-400">Local time · based on conversation start time</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-20 mt-1">
            {data.hourlyData.map((count, hour) => {
              const h = Math.max(4, Math.round((count / maxHour) * 100));
              const isPeak = count === maxHour && count > 0;
              return (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      isPeak ? "bg-blue-500" : "bg-blue-200 group-hover:bg-blue-400"
                    )}
                    style={{ height: `${h}%`, minHeight: "2px" }}
                    title={`${hour}:00 — ${count} chats`}
                  />
                  {/* Show label every 3 hours */}
                  {hour % 3 === 0 && (
                    <span className="text-xs text-slate-400 tabular-nums">{hour}h</span>
                  )}
                  {/* Tooltip */}
                  {count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {hour}:00 · {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {maxHour > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              Peak: {data.hourlyData.indexOf(maxHour)}:00 with {maxHour} conversation{maxHour !== 1 ? "s" : ""}
            </p>
          )}
          {maxHour === 0 && (
            <p className="text-xs text-slate-300 mt-2 text-center">No data for this period</p>
          )}
        </CardContent>
      </Card>

      {/* ── AI + Intent section ── */}
      {data.sessionCount > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* AI vs Human */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                AI vs Human Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "AI Resolved",   count: data.aiHandled,    color: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-400" },
                { label: "Human Handoff", count: data.humanHandled, color: "bg-amber-500",   text: "text-amber-600",  dot: "bg-amber-400" },
              ].map(({ label, count, color, text, dot }) => {
                const total = data.aiHandled + data.humanHandled;
                const p = pct(count, total);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1 items-center">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className={`w-2 h-2 rounded-full ${dot}`} />{label}
                      </span>
                      <span className={`font-semibold ${text}`}>{count} <span className="text-slate-400 font-normal">({p}%)</span></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <Brain className="w-3.5 h-3.5" />
                {data.sessionCount} sessions · {data.kbCount} KB articles active
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
              {data.topIntents.length === 0 ? (
                <div className="text-center py-6">
                  <Brain className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No intent data yet</p>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {data.topIntents.map(({ label, count }) => {
                    const p = pct(count, data.sessionCount);
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={cn("capitalize font-medium", INTENT_TEXT[label] ?? "text-slate-600")}>{label}</span>
                          <span className="text-slate-400">{count} ({p}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", INTENT_BAR[label] ?? "bg-slate-400")} style={{ width: `${p}%` }} />
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

      {/* ── Agent workload ── */}
      {data.agents.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-500" />
              Agent Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.agents.map((agent) => (
                <div key={agent.agentId} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold">
                      {agent.agentId.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                      STATUS_DOT[agent.onlineStatus] ?? "bg-slate-300"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 capitalize">{agent.onlineStatus}</p>
                    <p className="text-xs text-slate-400">{agent.activeChatCount} active chat{agent.activeChatCount !== 1 ? "s" : ""}</p>
                  </div>
                  {agent.onlineStatus === "online"
                    ? <Wifi className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <WifiOff className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  }
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Per-chatbot table ── */}
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
          {data.botStats.length > 0 ? (
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
                  {data.botStats.map((bot) => {
                    const avg    = bot.total > 0 ? (bot.messages / bot.total).toFixed(1) : "0";
                    const resPct = pct(bot.resolved, bot.total);
                    return (
                      <tr key={bot.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link href={`/dashboard/chatbots/${bot.id}`} className="flex items-center gap-2.5 group">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bot.color ?? "#6366f1" }}>
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-semibold text-slate-800 group-hover:text-emerald-600 text-sm">{bot.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">{bot.total}</td>
                        <td className="px-4 py-3.5 text-right"><span className="text-emerald-600 font-semibold">{bot.open}</span></td>
                        <td className="px-4 py-3.5 text-right">
                          {bot.escalated > 0
                            ? <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle className="w-3 h-3" />{bot.escalated}</span>
                            : <span className="text-slate-300">0</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-600 font-medium">{bot.resolved}</td>
                        <td className="px-4 py-3.5 text-right text-slate-500 font-medium">{avg}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resPct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums">{resPct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", bot.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
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
              <p className="text-slate-400 text-sm">No chatbot data for this period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── KPI card inner ── */
function KpiInner({ s }: { s: { label: string; value: string | number; sub: string; icon: React.ElementType; color: string; bg: string } }) {
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
