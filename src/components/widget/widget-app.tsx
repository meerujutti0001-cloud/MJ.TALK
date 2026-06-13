"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, ChevronDown, User } from "lucide-react";
import { cn, generateSessionId } from "@/lib/utils";
import type { WidgetConfig, ChatMessage, PreChatFormData } from "@/types";

interface WidgetAppProps {
  config: WidgetConfig;
  apiUrl: string;
}

type UIMessage = {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: Date;
};

export function WidgetApp({ config, apiUrl }: WidgetAppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
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
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Restore session from storage
  useEffect(() => {
    const storedConvId = sessionStorage.getItem(`conv_${config.id}`);
    if (storedConvId) setConversationId(storedConvId);

    const storedMsgs = sessionStorage.getItem(`msgs_${config.id}`);
    if (storedMsgs) {
      try {
        const parsed = JSON.parse(storedMsgs);
        setMessages(parsed.map((m: UIMessage) => ({ ...m, timestamp: new Date(m.timestamp) })));
        setShowPreChat(false);
      } catch {}
    }
  }, [config.id]);

  // Listen for postMessage from host page (widget.js public API)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SUPPORTAI_OPEN") handleOpen();
      if (e.data?.type === "SUPPORTAI_CLOSE") setIsOpen(false);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`msgs_${config.id}`, JSON.stringify(messages));
    }
  }, [messages, config.id]);

  const initConversation = async (visitor?: PreChatFormData) => {
    const browserInfo = typeof navigator !== "undefined"
      ? navigator.userAgent.slice(0, 100)
      : undefined;
    const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;

    const res = await fetch(`${apiUrl}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatbotId: config.id,
        sessionId,
        visitorName: visitor?.name || null,
        visitorEmail: visitor?.email || null,
        pageUrl,
        browserInfo,
      }),
    });

    if (!res.ok) throw new Error("Failed to start conversation");
    const data = await res.json();
    const convId = data.conversation.id;
    setConversationId(convId);
    sessionStorage.setItem(`conv_${config.id}`, convId);
    return convId;
  };

  const sendMessage = async (text: string, convId: string) => {
    // Save user message first
    await fetch(`${apiUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, role: "user", content: text }),
    });

    const currentMessages = messages.filter((m) => m.role !== "admin");
    const apiMessages: ChatMessage[] = [
      ...currentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: text },
    ];

    setIsTyping(true);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
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
        throw new Error("AI response failed");
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let aiText = "";
      const aiMsgId = `ai_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", timestamp: new Date() },
      ]);
      setIsTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: aiText } : m
          )
        );
      }

      // Check for escalation keyword
      const keyword = config.escalation_keyword ?? "ESCALATE";
      if (aiText.toUpperCase().includes(keyword.toUpperCase())) {
        setIsEscalated(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setIsTyping(false);
      setError("Sorry, something went wrong. Please try again.");
      // Retry logic: remove the failed state message
      setMessages((prev) => prev.filter((m) => m.role !== "assistant" || m.content !== ""));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: UIMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      let convId = conversationId;
      if (!convId) {
        convId = await initConversation();
      }
      await sendMessage(text, convId!);
    } catch {
      setError("Failed to send message. Please try again.");
    }
  };

  const handlePreChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await initConversation(preChatData);
      setShowPreChat(false);

      // Welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi ${preChatData.name || "there"}! How can I help you today?`,
        timestamp: new Date(),
      }]);
    } catch {
      setError("Failed to start chat. Please try again.");
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);

    // If no pre-chat form and no messages, show welcome
    if (!config.pre_chat_form_enabled && messages.length === 0 && !conversationId) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm ${config.name}. How can I help you today?`,
        timestamp: new Date(),
      }]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3 font-sans">
      {/* Chat window */}
      {isOpen && (
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ width: "360px", height: "560px" }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ backgroundColor: config.widget_color }}
          >
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{config.name}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                <p className="text-white/80 text-xs">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Body */}
          {showPreChat ? (
            // Pre-chat form
            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-center mb-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${config.widget_color}20` }}
                >
                  <MessageCircle className="w-7 h-7" style={{ color: config.widget_color }} />
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Start a conversation</h3>
                <p className="text-slate-500 text-sm mt-1">Tell us a bit about yourself.</p>
              </div>
              <form onSubmit={handlePreChatSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Name *</label>
                  <input
                    type="text"
                    value={preChatData.name}
                    onChange={(e) => setPreChatData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--tw-ring-color": config.widget_color } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={preChatData.email}
                    onChange={(e) => setPreChatData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 mt-2"
                  style={{ backgroundColor: config.widget_color }}
                >
                  Start Chat
                </button>
              </form>
            </div>
          ) : (
            // Messages
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role !== "user" && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ backgroundColor: `${config.widget_color}20` }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" style={{ color: config.widget_color }} />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : msg.role === "admin"
                          ? "bg-emerald-500 text-white rounded-tl-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm",
                    )}
                    style={msg.role === "user" ? { backgroundColor: config.widget_color } : {}}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.widget_color}20` }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" style={{ color: config.widget_color }} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="text-center text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                    <button
                      onClick={() => setError(null)}
                      className="ml-2 underline hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Escalation banner */}
                {isEscalated && (
                  <div className="text-center text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2.5">
                    🙋 A human agent will be with you shortly.
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-slate-200 p-3 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400"
                    style={{ maxHeight: "96px", "--tw-ring-color": config.widget_color } as React.CSSProperties}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90"
                    style={{ backgroundColor: config.widget_color }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-center text-xs text-slate-300 mt-2">
                  Powered by SupportAI
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Launcher button */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 widget-pulse"
        style={{ backgroundColor: config.widget_color }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
