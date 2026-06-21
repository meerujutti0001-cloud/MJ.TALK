"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRealtimeNotifications, playNotificationPing } from "@/hooks/use-realtime-notifications";
import type { NotificationPayload } from "@/hooks/use-realtime-notifications";
import { toast } from "@/hooks/use-toast";

/* ─── Context ─── */
interface NotificationContextValue {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  decrementUnread: (by?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  setUnreadCount: () => {},
  decrementUnread: () => {},
});

export function useNotificationContext() {
  return useContext(NotificationContext);
}

/* ─── Provider ─── */
interface Props {
  children: React.ReactNode;
  orgId: string;
  initialUnreadCount: number;
}

export function RealtimeNotificationProvider({
  children,
  orgId,
  initialUnreadCount,
}: Props) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // Keep count in sync if server re-renders with a different initial value
  const initialRef = useRef(initialUnreadCount);
  useEffect(() => {
    if (initialRef.current !== initialUnreadCount) {
      initialRef.current = initialUnreadCount;
      setUnreadCount(initialUnreadCount);
    }
  }, [initialUnreadCount]);

  const decrementUnread = useCallback((by = 1) => {
    setUnreadCount((c) => Math.max(0, c - by));
  }, []);

  const handleNew = useCallback(
    (notification: NotificationPayload) => {
      // Bump badge
      setUnreadCount((c) => c + 1);

      // Play sound
      const isUrgent =
        notification.type === "escalated" ||
        notification.type === "flagged";
      playNotificationPing(isUrgent ? "urgent" : "normal");

      // Show toast
      const titles: Record<string, string> = {
        escalated: "🚨 Chat Escalated",
        flagged: "🚩 Conversation Flagged",
        new_message: "💬 New Message",
        new_chat: "💬 New Chat",
        idle: "⏰ Idle Conversation",
      };
      const title = titles[notification.type] ?? "🔔 Notification";

      toast({
        title,
        description: notification.message,
        variant: isUrgent ? "destructive" : "default",
        // Auto-dismiss after 6 s
        duration: 6000,
      });
    },
    []
  );

  useRealtimeNotifications({ orgId, onNew: handleNew });

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUnreadCount, decrementUnread }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
