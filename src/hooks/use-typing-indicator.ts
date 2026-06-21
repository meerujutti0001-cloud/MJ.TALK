"use client";

import { useEffect, useRef, useCallback } from "react";

const TYPING_TIMEOUT_MS = 2500; // stop indicator after 2.5 s of silence

interface UseTypingIndicatorOptions {
  conversationId: string | null;
  /** "user" for widget side, "admin" for dashboard side */
  selfRole: "user" | "admin";
  /** The opposite role we want to watch */
  watchRole: "user" | "admin";
  onRemoteTyping: (isTyping: boolean) => void;
}

/**
 * Manages both:
 *  1. Sending typing events to /api/conversations/typing (debounced)
 *  2. Subscribing to the typing_indicators table to receive remote events
 *
 * Falls back gracefully if the table doesn't exist yet.
 */
export function useTypingIndicator({
  conversationId,
  selfRole,
  watchRole,
  onRemoteTyping,
}: UseTypingIndicatorOptions) {
  const stopTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSendingRef    = useRef(false);
  const onRemoteRef     = useRef(onRemoteTyping);
  const remoteTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onRemoteRef.current = onRemoteTyping; }, [onRemoteTyping]);

  /* ── Send typing state to API ── */
  const sendTyping = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId) return;
      try {
        await fetch("/api/conversations/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, role: selfRole, isTyping }),
        });
      } catch { /* silent */ }
    },
    [conversationId, selfRole]
  );

  /* ── Called on every keystroke ── */
  const onKeystroke = useCallback(() => {
    if (!conversationId) return;

    // Send "is typing" once (not every keypress)
    if (!isSendingRef.current) {
      isSendingRef.current = true;
      sendTyping(true);
    }

    // Reset auto-stop timer
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      isSendingRef.current = false;
      sendTyping(false);
    }, TYPING_TIMEOUT_MS);
  }, [conversationId, sendTyping]);

  /* ── Stop typing immediately (on send) ── */
  const onSend = useCallback(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    isSendingRef.current = false;
    sendTyping(false);
  }, [sendTyping]);

  /* ── Subscribe to remote typing events via Supabase Realtime ── */
  useEffect(() => {
    if (!conversationId) return;

    let channel: { unsubscribe: () => void } | null = null;

    const setup = async () => {
      try {
        const { createBrowserClient } = await import("@supabase/ssr");
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        channel = supabase
          .channel(`typing:${conversationId}:${watchRole}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "typing_indicators",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              const row = payload.new as { role?: string } | null;

              if (payload.eventType === "DELETE" || !row) {
                // Only clear if it's the watched role
                const old = payload.old as { role?: string } | null;
                if (old?.role === watchRole) {
                  if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
                  onRemoteRef.current(false);
                }
                return;
              }

              if (row.role === watchRole) {
                onRemoteRef.current(true);
                // Auto-clear after timeout as safety net
                if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
                remoteTimerRef.current = setTimeout(() => {
                  onRemoteRef.current(false);
                }, TYPING_TIMEOUT_MS + 500);
              }
            }
          )
          .subscribe();
      } catch { /* graceful degradation */ }
    };

    setup();

    return () => {
      channel?.unsubscribe();
      if (stopTimerRef.current)   clearTimeout(stopTimerRef.current);
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
    };
  }, [conversationId, watchRole]);

  return { onKeystroke, onSend };
}
