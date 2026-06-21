"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle, Flag, Clock, CheckCheck, Bell,
  MessageSquare, UserCheck, AtSign, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Notification } from "@/types";

interface NotificationsListProps {
  notifications: Notification[];
  orgId: string;
}

/* ─── per-type config ─── */
const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; colorClass: string; label: string }
> = {
  escalated:   { icon: AlertTriangle,  colorClass: "text-red-500 bg-red-50",      label: "Escalated"     },
  flagged:     { icon: Flag,           colorClass: "text-yellow-500 bg-yellow-50", label: "Flagged"       },
  idle:        { icon: Clock,          colorClass: "text-slate-500 bg-slate-100",  label: "Idle"          },
  new_message: { icon: MessageSquare,  colorClass: "text-blue-500 bg-blue-50",     label: "New Message"   },
  new_chat:    { icon: MessageSquare,  colorClass: "text-emerald-500 bg-emerald-50", label: "New Chat"    },
  assigned:    { icon: UserCheck,      colorClass: "text-purple-500 bg-purple-50", label: "Assigned"      },
  mention:     { icon: AtSign,         colorClass: "text-indigo-500 bg-indigo-50", label: "Mentioned"     },
};

const FALLBACK_CONFIG = { icon: Bell, colorClass: "text-slate-500 bg-slate-100", label: "Notification" };

/* ─── priority badge ─── */
function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority || priority === "normal" || priority === "low") return null;
  const cfg: Record<string, string> = {
    high:   "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };
  return (
    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide", cfg[priority] ?? "")}>
      {priority}
    </span>
  );
}

export function NotificationsList({ notifications: initial, orgId }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  /* ── Realtime: new notifications ── */
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`notif_list:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === payload.new.id)) return prev;
            return [payload.new as Notification, ...prev];
          });
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => n.id === payload.new.id ? { ...n, ...payload.new } : n)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const markRead = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    router.refresh();
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const supabase = getSupabase();
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({ title: "All notifications marked as read" });
    router.refresh();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayed   = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                filter === f
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {f}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 text-xs">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">
              {filter === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {displayed.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG;
              const Icon = cfg.icon;
              const conv = n.conversation as
                | { id: string; visitor_name?: string; chatbots?: { name?: string } }
                | undefined;
              const isUrgent = n.type === "escalated" || n.priority === "high" || n.priority === "urgent";

              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-5 py-4 transition-colors",
                    !n.read && isUrgent  && "bg-red-50/40 hover:bg-red-50/60",
                    !n.read && !isUrgent && "bg-emerald-50/50 hover:bg-emerald-50",
                    n.read && "hover:bg-slate-50 opacity-70"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    cfg.colorClass
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        isUrgent ? "text-red-600" : "text-slate-500"
                      )}>
                        {cfg.label}
                      </span>
                      <PriorityBadge priority={n.priority} />
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>

                    <p className={cn(
                      "text-sm leading-snug",
                      !n.read ? "font-medium text-slate-900" : "text-slate-600"
                    )}>
                      {n.message}
                    </p>

                    {conv && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Link
                          href={`/dashboard/conversations?id=${conv.id}`}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          View conversation →
                        </Link>
                        <span className="text-xs text-slate-400">
                          {conv.visitor_name ?? "Anonymous"}
                          {conv.chatbots?.name ? ` · ${conv.chatbots.name}` : ""}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-1">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>

                  {/* Action */}
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-emerald-500 hover:text-emerald-700 font-medium flex-shrink-0 mt-1 whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Stats footer */}
      {notifications.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {notifications.length} total · {unreadCount} unread · showing {displayed.length}
        </p>
      )}
    </div>
  );
}
