"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Flag, Clock, CheckCheck, Bell } from "lucide-react";
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

const TYPE_ICONS = {
  escalated: AlertTriangle,
  flagged: Flag,
  idle: Clock,
};

const TYPE_COLORS = {
  escalated: "text-red-500 bg-red-50",
  flagged: "text-yellow-500 bg-yellow-50",
  idle: "text-slate-500 bg-slate-100",
};

export function NotificationsList({ notifications: initial, orgId }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initial);
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  // Realtime: new notifications
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("notifications:live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `org_id=eq.${orgId}` },
        (payload) => {
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === payload.new.id);
            if (exists) return prev;
            return [payload.new as Notification, ...prev];
          });
          toast({ title: "New notification", description: (payload.new as Notification).message });
          router.refresh();
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

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{unreadCount}</span> unread
          </p>
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 text-xs">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type];
              const conv = n.conversation as { id: string; visitor_name?: string; chatbots?: { name?: string } } | undefined;

              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-5 py-4 transition-colors",
                    !n.read && "bg-emerald-50/50 hover:bg-emerald-50",
                    n.read && "hover:bg-slate-50"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", TYPE_COLORS[n.type])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !n.read ? "font-medium text-slate-900" : "text-slate-700")}>
                      {n.message}
                    </p>
                    {conv && (
                      <div className="flex items-center gap-2 mt-1">
                        <Link
                          href={`/dashboard/conversations?id=${conv.id}`}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          View conversation →
                        </Link>
                        <span className="text-xs text-slate-400">
                          {conv.visitor_name ?? "Anonymous"} · {conv.chatbots?.name}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-emerald-500 hover:text-emerald-700 font-medium flex-shrink-0 mt-1"
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
    </div>
  );
}
