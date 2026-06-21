"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, X, Send, User, Smile, Paperclip,
  RotateCcw, Volume2, VolumeX, Minimize2, UserCheck,
} from "lucide-react";
import { cn, generateSessionId } from "@/lib/utils";
import type { ChatMessage, PreChatFormData } from "@/types";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";

/* ─── types ─── */
export interface WidgetConfig {
  id: string;
  name: string;
  widget_color: string;
  avatar_url: string | null;
  pre_chat_form_enabled: boolean;
  escalation_keyword: string;
  status: "active" | "inactive";
}

type UIMessage = {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "failed"; // Phase 4: delivery state
};

interface WidgetAppProps {
  config: WidgetConfig;
  /** Absolute base URL for API calls. The component ignores this and always
   *  derives the origin from window.location so it works on localhost AND prod. */
  apiUrl?: string;
}

/* ─── tiny markdown renderer ─── */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1</a>')
    .replace(/\n/g, "<br/>");
}

/* ─── soft ping via Web Audio ─── */
function playPing() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx  = new AudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch { /* silent */ }
}

/* ─── component ─── */
export function WidgetApp({ config }: WidgetAppProps) {
  // Always use the iframe's own origin for API calls — works on localhost + Vercel
  const getApiBase = () =>
    typeof window !== "undefined" ? window.location.origin : "";

  const [isOpen, setIsOpen]           = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages]       = useState<UIMessage[]>([]);
  const [input, setInput]             = useState("");
  const [isTyping, setIsTyping]       = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEmojiHint, setShowEmojiHint] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return generateSessionId();
    const stored = sessionStorage.getItem(`si_${config.id}`);
    if (stored) return stored;
    const id = generateSessionId();
    sessionStorage.setItem(`si_${config.id}`, id);
    return id;
  });
  const [showPreChat, setShowPreChat] = useState(config.pre_chat_form_enabled);
  const [preChatData, setPreChatData] = useState<PreChatFormData>({ name: "", email: "" });
  const [isEscalated, setIsEscalated] = useState(false);
  const [escalationPending, setEscalationPending] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // Phase 3: agent typing indicator visible in widget
  const [agentIsTyping, setAgentIsTyping] = useState(false);
  // Phase 4: chat state for UX feedback
  const [chatState, setChatState] = useState<
    "idle" | "ai_responding" | "human_requested" | "waiting_agent" | "agent_joined" | "resolved"
  >("idle");
  const [sendRetryFn, setSendRetryFn] = useState<(() => void) | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // Phase 3: typing indicator hook
  const { onKeystroke: typingKeystroke, onSend: typingSend } = useTypingIndicator({
    conversationId,
    selfRole: "user",
    watchRole: "admin",
    onRemoteTyping: setAgentIsTyping,
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* ── Restore session ── */
  useEffect(() => {
    const storedConvId = sessionStorage.getItem(`conv_${config.id}`);
    if (storedConvId) setConversationId(storedConvId);
    const storedMsgs = sessionStorage.getItem(`msgs_${config.id}`);
    if (storedMsgs) {
      try {
        const parsed = JSON.parse(storedMsgs);
        setMessages(parsed.map((m: UIMessage) => ({ ...m, timestamp: new Date(m.timestamp) })));
        setShowPreChat(false);
      } catch { /* ignore */ }
    }
    const storedEscalated = sessionStorage.getItem(`esc_${config.id}`);
    if (storedEscalated === "1") setIsEscalated(true);
  }, [config.id]);

  /* ── Supabase Realtime — admin messages ── */
  useEffect(() => {
    if (!conversationId) return;
    let channel: { unsubscribe: () => void } | null = null;

    const setup = async () => {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      channel = supabase
        .channel(`widget_msgs:${conversationId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          (payload: { new: { id: string; role: string; content: string; created_at: string } }) => {
            const row = payload.new;
            if (row.role !== "admin") return;
            const newMsg: UIMessage = { id: row.id, role: "admin", content: row.content, timestamp: new Date(row.created_at) };
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [...prev, newMsg];
            });
            if (!isOpen) { setUnreadCount((c) => c + 1); setHasNewMessage(true); }
            setChatState("agent_joined");
            if (soundEnabled) playPing();
          }
        )
        .subscribe();
    };

    setup().catch(console.error);
    return () => { channel?.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  /* ── Persist messages ── */
  useEffect(() => {
    if (messages.length > 0) sessionStorage.setItem(`msgs_${config.id}`, JSON.stringify(messages));
  }, [messages, config.id]);

  /* ── Persist escalation state ── */
  useEffect(() => {
    if (isEscalated) sessionStorage.setItem(`esc_${config.id}`, "1");
  }, [isEscalated, config.id]);

  /* ── postMessage API ── */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SUPPORTAI_OPEN")  handleOpen();
      if (e.data?.type === "SUPPORTAI_CLOSE") setIsOpen(false);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) { setUnreadCount(0); setHasNewMessage(false); setTimeout(() => inputRef.current?.focus(), 150); }
  }, [isOpen]);

  /* ── Auto-resize textarea ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    typingKeystroke();
  };

  /* ── Init conversation ── */
  const initConversation = async (visitor?: PreChatFormData) => {
    const api = getApiBase();
    const browserInfo = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 100) : undefined;
    const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;

    const res = await fetch(`${api}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatbotId: config.id, sessionId,
        visitorName: visitor?.name || null, visitorEmail: visitor?.email || null,
        pageUrl, browserInfo,
      }),
    });

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      // Free plan chat limit reached — show a friendly message
      const limitMsg = data.message ?? "This service has reached its monthly chat limit. Please try again next month or contact support.";
      throw new Error(`LIMIT_REACHED:${limitMsg}`);
    }

    if (!res.ok) throw new Error("Failed to start conversation");
    const data = await res.json();
    const convId = data.conversation.id;
    setConversationId(convId);
    sessionStorage.setItem(`conv_${config.id}`, convId);
    return convId;
  };

  /* ── Send message ── */
  const sendMessage = async (text: string, convId: string) => {
    const api = getApiBase();

    // Persist user message
    await fetch(`${api}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, role: "user", content: text }),
    });

    const history = messages.filter((m) => m.role !== "admin");
    const apiMessages: ChatMessage[] = [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: text },
    ];

    setIsTyping(true);
    setChatState("ai_responding");
    setError(null);
    setSendRetryFn(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${api}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          chatbotId: config.id,
          conversationId: convId,
          sessionId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        try { const j = await res.json(); errMsg = j.error ?? errMsg; } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const contentType = res.headers.get("content-type") || "";
      
      if (contentType.includes("text/event-stream")) {
        const tempId = `ai_${Date.now()}`;
        let fullText = "";
        
        setMessages((prev) => [
          ...prev,
          { id: tempId, role: "assistant" as const, content: "", timestamp: new Date() },
        ]);
        
        setIsTyping(false);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            setMessages((prev) =>
              prev.map((m) => m.id === tempId ? { ...m, content: fullText } : m)
            );
          }
        }

        const keyword = config.escalation_keyword ?? "ESCALATE";
        if (fullText.toUpperCase().includes(keyword.toUpperCase())) {
          setIsEscalated(true);
          setChatState("waiting_agent");
        } else {
          setChatState("idle");
        }
        if (soundEnabled && fullText) playPing();
        
      } else {
        const replyText = await res.text();
        if (!replyText.trim()) throw new Error("Empty response from AI");

        setMessages((prev) => [
          ...prev,
          { id: `ai_${Date.now()}`, role: "assistant" as const, content: replyText, timestamp: new Date() },
        ]);

        const keyword = config.escalation_keyword ?? "ESCALATE";
        if (replyText.toUpperCase().includes(keyword.toUpperCase())) {
          setIsEscalated(true);
          setChatState("waiting_agent");
        } else {
          setChatState("idle");
        }
        if (soundEnabled) playPing();
      }
      
      setIsTyping(false);

    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setIsTyping(false);
      setChatState("idle");
      const errMsg = err instanceof Error ? err.message : "Something went wrong.";
      setError(errMsg);
      // Store retry function
      setSendRetryFn(() => () => sendMessage(text, convId));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    const msgId = `user_${Date.now()}`;
    setMessages((prev) => [...prev, { id: msgId, role: "user", content: text, timestamp: new Date(), status: "sending" }]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    typingSend();
    try {
      let convId = conversationId;
      if (!convId) convId = await initConversation();
      // Mark as sent
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "sent" } : m));
      await sendMessage(text, convId!);
    } catch (err) {
      // Mark as failed
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "failed" } : m));
      const errMsg = err instanceof Error ? err.message : "Message failed to send.";
      if (errMsg.startsWith("LIMIT_REACHED:")) {
        setError(errMsg.replace("LIMIT_REACHED:", ""));
      } else {
        setError("Message failed to send.");
      }
      setSendRetryFn(() => () => {
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "sending" } : m));
        setError(null);
        sendMessage(text, conversationId!).catch(() => {
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "failed" } : m));
        });
      });
    }
  };

  const handlePreChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await initConversation(preChatData);
      setShowPreChat(false);
      setMessages([{ id: "welcome", role: "assistant", content: `Hi ${preChatData.name || "there"}! 👋 How can I help you today?`, timestamp: new Date() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.startsWith("LIMIT_REACHED:")) {
        setError(msg.replace("LIMIT_REACHED:", ""));
      } else {
        setError("Failed to start chat. Please try again.");
      }
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!config.pre_chat_form_enabled && messages.length === 0 && !conversationId) {
      setMessages([{ id: "welcome", role: "assistant", content: `Hi! 👋 I'm ${config.name}. How can I help you today?`, timestamp: new Date() }]);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([]); setConversationId(null); setIsEscalated(false);
    setEscalationPending(false);
    setError(null); setInput(""); setShowPreChat(config.pre_chat_form_enabled);
    sessionStorage.removeItem(`conv_${config.id}`);
    sessionStorage.removeItem(`msgs_${config.id}`);
    sessionStorage.removeItem(`esc_${config.id}`);
    if (!config.pre_chat_form_enabled) {
      setMessages([{ id: "welcome", role: "assistant", content: `Hi! 👋 I'm ${config.name}. How can I help you today?`, timestamp: new Date() }]);
    }
  };

  /* ── Request human agent ── */
  const handleRequestHuman = async () => {
    if (escalationPending || isEscalated) return;
    setEscalationPending(true);
    setError(null);

    try {
      let convId = conversationId;
      if (!convId) convId = await initConversation();

      const api = getApiBase();
      const res = await fetch(`${api}/api/chat/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: config.id,
          sessionId,
          conversationId: convId,
          visitorName: preChatData.name || null,
          visitorEmail: preChatData.email || null,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          browserInfo: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 100) : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to reach support");

      const data = await res.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
        sessionStorage.setItem(`conv_${config.id}`, data.conversationId);
      }

      setIsEscalated(true);
      setChatState("waiting_agent");
      // System message added by the API is picked up via Realtime — no need to push manually
    } catch {
      setError("Could not connect to support. Please try again.");
    } finally {
      setEscalationPending(false);
    }
  };

  const color       = config.widget_color;
  const lightColor  = `${color}18`;
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="fixed bottom-5 right-5 z-[2147483647] flex flex-col items-end gap-3 font-sans select-none">

      {/* ── Chat window ── */}
      {isOpen && !isMinimized && (
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-2xl"
          style={{ width: "370px", height: "580px", background: "#fff", animation: "widgetSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20 ring-2 ring-white/30">
              {config.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={config.avatar_url} alt="Bot" className="w-full h-full rounded-full object-cover" />
                : <MessageCircle className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">{config.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  chatState === "ai_responding" ? "bg-amber-300 animate-pulse" :
                  chatState === "waiting_agent" ? "bg-orange-300 animate-pulse" :
                  chatState === "agent_joined"  ? "bg-emerald-300" :
                  "bg-emerald-300 animate-pulse"
                )} />
                <span className="text-white/80 text-xs">
                  {escalationPending    ? "Connecting to agent…"  :
                   chatState === "ai_responding" ? "AI is responding…" :
                   chatState === "waiting_agent" ? "Waiting for agent…" :
                   chatState === "agent_joined"  ? "Agent connected ✓" :
                   isEscalated ? "Human agent joining…" :
                   "Online · replies instantly"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setSoundEnabled((s) => !s)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title={soundEnabled ? "Mute" : "Unmute"}>
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white/80" /> : <VolumeX className="w-3.5 h-3.5 text-white/80" />}
              </button>
              <button onClick={() => setIsMinimized(true)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title="Minimize">
                <Minimize2 className="w-3.5 h-3.5 text-white/80" />
              </button>
              <button onClick={handleReset} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title="New chat">
                <RotateCcw className="w-3.5 h-3.5 text-white/80" />
              </button>
              <button onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title="Close">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Pre-chat form */}
          {showPreChat ? (
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm" style={{ background: lightColor }}>
                  <MessageCircle className="w-8 h-8" style={{ color }} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Start a conversation</h3>
                <p className="text-slate-500 text-sm mt-1">We&apos;ll reach out to you right away.</p>
              </div>
              {error && <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">{error}</div>}
              <form onSubmit={handlePreChatSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Your Name *</label>
                  <input type="text" value={preChatData.name} onChange={(e) => setPreChatData((p) => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" required className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-shadow" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email Address *</label>
                  <input type="email" value={preChatData.email} onChange={(e) => setPreChatData((p) => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" required className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-shadow" />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] mt-1 shadow-sm" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
                  Start Chat →
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" style={{ scrollBehavior: "smooth" }}>
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const showTime = i === messages.length - 1 || Math.abs(messages[i + 1].timestamp.getTime() - msg.timestamp.getTime()) > 60000;
                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm" style={{ background: lightColor }}>
                          {msg.role === "admin"
                            ? <User className="w-3.5 h-3.5" style={{ color }} />
                            : config.avatar_url
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={config.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              : <MessageCircle className="w-3.5 h-3.5" style={{ color }} />}
                        </div>
                      )}
                      <div className={cn("flex flex-col max-w-[78%]", isUser && "items-end")}>
                        {i === 0 || messages[i - 1].role !== msg.role ? (
                          <span className="text-xs text-slate-400 mb-1 ml-0.5">
                            {isUser ? "" : msg.role === "admin" ? "Agent" : config.name}
                          </span>
                        ) : null}
                        <div
                          className={cn(
                            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                            isUser ? "text-white rounded-tr-sm shadow-sm" : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm",
                            msg.role === "admin" && "!bg-emerald-500 !text-white !border-emerald-400"
                          )}
                          style={isUser ? { background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` } : {}}
                          {...(isUser ? {} : { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } })}
                        >
                          {isUser ? msg.content : undefined}
                        </div>
                        {showTime && <span className="text-xs text-slate-300 mt-1 px-1">{fmt(msg.timestamp)}</span>}
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* AI/agent typing indicator */}
                {(isTyping || agentIsTyping) && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: lightColor }}>
                      {agentIsTyping
                        ? <User className="w-3.5 h-3.5" style={{ color }} />
                        : <MessageCircle className="w-3.5 h-3.5" style={{ color }} />}
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: `${color}99` }} />
                        ))}
                      </div>
                    </div>
                    {agentIsTyping && (
                      <span className="text-xs text-slate-400 self-end mb-1">Agent typing…</span>
                    )}
                  </div>
                )}

                {error && (
                  <div className="text-center text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <p className="font-medium mb-1">⚠️ Something went wrong</p>
                    <p>{error}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {sendRetryFn && (
                        <button onClick={() => { sendRetryFn(); }} className="underline hover:no-underline font-medium">
                          Retry
                        </button>
                      )}
                      <button onClick={() => setError(null)} className="text-slate-400 underline hover:no-underline">Dismiss</button>
                    </div>
                  </div>
                )}

                {/* Chat state indicators */}
                {chatState === "waiting_agent" && (
                  <div className="rounded-xl px-3 py-3 border text-center" style={{ background: `${color}10`, borderColor: `${color}30` }}>
                    <p className="text-xs font-semibold mb-1" style={{ color }}>🔔 Human Agent Requested</p>
                    <p className="text-xs text-slate-500">A support agent has been notified and will join shortly.</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: `${color}80` }} />
                      ))}
                    </div>
                  </div>
                )}

                {chatState === "agent_joined" && (
                  <div className="rounded-xl px-3 py-2.5 border text-center bg-emerald-50 border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700">✅ Agent Connected</p>
                    <p className="text-xs text-emerald-600 mt-0.5">You are now chatting with a human agent.</p>
                  </div>
                )}

                {isEscalated && chatState !== "waiting_agent" && chatState !== "agent_joined" && (
                  <div className="text-center text-xs rounded-xl px-3 py-2.5 border" style={{ background: `${color}18`, borderColor: `${color}40`, color }}>
                    ✅ A human agent has been notified and will join shortly.
                  </div>
                )}

                {!isEscalated && messages.length > 0 && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleRequestHuman}
                      disabled={escalationPending}
                      className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
                      style={{ borderColor: `${color}50`, color, background: `${color}10` }}
                    >
                      {escalationPending ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Connecting…
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Talk to a Human Agent
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="bg-white border-t border-slate-100 px-3 py-2.5 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <button onClick={() => setShowEmojiHint((s) => !s)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 mb-1" title="Emoji">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 mb-1" title="Attach file" onClick={() => alert("File attachments coming soon!")}>
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400 transition-shadow"
                    style={{ maxHeight: "120px", minHeight: "38px", lineHeight: "1.5" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 hover:opacity-90 active:scale-95 mb-0.5 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>

                {showEmojiHint && (
                  <div className="flex flex-wrap gap-1 mt-2 px-1">
                    {["👋", "😊", "🙏", "✅", "❓", "👍", "🤔", "😄"].map((emoji) => (
                      <button key={emoji} onClick={() => { setInput((v) => v + emoji); setShowEmojiHint(false); inputRef.current?.focus(); }} className="text-lg hover:scale-125 transition-transform">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-center text-xs text-slate-300 mt-2 pb-0.5">
                  Powered by <span style={{ color }}>MJ.TALK</span>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Minimized pill ── */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-white shadow-xl transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{config.name}</span>
          {unreadCount > 0 && (
            <span className="bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ color }}>
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Launcher button ── */}
      {!isOpen && (
        <div className="relative">
          {hasNewMessage && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: color }} />
          )}
          <button
            onClick={handleOpen}
            className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes widgetSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
