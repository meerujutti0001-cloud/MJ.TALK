"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type NotificationPayload = {
  id: string;
  type: string;
  message: string;
  conversation_id: string;
  priority?: string;
  read: boolean;
  created_at: string;
};

interface UseRealtimeNotificationsOptions {
  orgId: string;
  onNew: (notification: NotificationPayload) => void;
}

/** Subscribes to new notifications for the org and calls onNew for each. */
export function useRealtimeNotifications({
  orgId,
  onNew,
}: UseRealtimeNotificationsOptions) {
  // Keep onNew stable so it doesn't re-trigger the effect
  const onNewRef = useRef(onNew);
  useEffect(() => { onNewRef.current = onNew; }, [onNew]);

  useEffect(() => {
    if (!orgId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications_org:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          onNewRef.current(payload.new as NotificationPayload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);
}

/** Plays a short notification ping via Web Audio API */
export function playNotificationPing(type: "normal" | "urgent" = "normal") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "urgent") {
      // Two-tone urgent alert
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    /* silent */
  }
}

/** Helper: maps notification type to a human-readable label */
export function useNotificationTitle() {
  return useCallback((type: string): string => {
    const map: Record<string, string> = {
      escalated: "🚨 Chat Escalated",
      new_message: "💬 New Message",
      new_chat: "💬 New Chat",
      flagged: "🚩 Conversation Flagged",
      idle: "⏰ Idle Conversation",
      assigned: "✓ Chat Assigned",
    };
    return map[type] ?? "🔔 Notification";
  }, []);
}
