"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, User, Minimize2, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const COLOR  = "#0d8585";
const LIGHT  = "#0d858518";

/* tiny markdown → safe HTML */
function md(text: string) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>')
    .replace(/\n/g, "<br/>");
}

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  content: "Hi there! 👋 I'm the MJ.TALK assistant. Ask me anything about the platform — features, pricing, setup, or how to get started!",
};

export function LandingWidget() {
  const [open, setOpen]         = useState(false);
  const [minimized, setMin]     = useState(false);
  const [msgs, setMsgs]         = useState<Msg[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const [unread, setUnread]     = useState(0);
  const [showEmoji, setEmoji]   = useState(false);
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scroll = useCallback(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), []);
  useEffect(() => { scroll(); }, [msgs, scroll]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); }
  }, [open]);

  const handleOpen = () => { setOpen(true); setMin(false); };

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: Msg = { id: `u_${Date.now()}`, role: "user", content: text };
    setMsgs((p) => [...p, userMsg]);
    setTyping(true);

    try {
      const history = [...msgs, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/platform-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const reply = await res.text();
      const botMsg: Msg = { id: `a_${Date.now()}`, role: "assistant", content: reply || "Sorry, I couldn't get a response. Try again!" };
      setMsgs((p) => [...p, botMsg]);
      if (!open) setUnread((c) => c + 1);
    } catch {
      setMsgs((p) => [...p, { id: `err_${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setTyping(false);
    }
  };

  const resize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3 font-sans select-none">

      {/* ── Chat window ── */}
      {open && !minimized && (
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-white"
          style={{ width: 360, height: 540, animation: "widgetSlideIn .22s cubic-bezier(.34,1.56,.64,1)" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${COLOR} 0%, ${COLOR}dd 100%)` }}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">MJ.TALK Support</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-white/80 text-xs">Online · replies instantly</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setMin(true)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title="Minimize">
                <Minimize2 size={13} className="text-white/80" />
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title="Close">
                <X size={15} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {msgs.map((msg, i) => {
              const isUser = msg.role === "user";
              const prevSame = i > 0 && msgs[i - 1].role === msg.role;
              return (
                <div key={msg.id} className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
                  {!isUser && !prevSame && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: LIGHT }}>
                      <MessageCircle size={13} style={{ color: COLOR }} />
                    </div>
                  )}
                  {!isUser && prevSame && <div className="w-7 flex-shrink-0" />}

                  <div className={cn("flex flex-col max-w-[78%]", isUser && "items-end")}>
                    {!prevSame && !isUser && (
                      <span className="text-xs text-slate-400 mb-0.5 ml-0.5">MJ.TALK Support</span>
                    )}
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm",
                        isUser
                          ? "text-white rounded-tr-sm"
                          : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                      )}
                      style={isUser ? { background: `linear-gradient(135deg,${COLOR},${COLOR}cc)` } : {}}
                      {...(isUser ? {} : { dangerouslySetInnerHTML: { __html: md(msg.content) } })}
                    >
                      {isUser ? msg.content : undefined}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={13} className="text-slate-500" />
                    </div>
                  )}
                </div>
              );
            })}

            {typing && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: LIGHT }}>
                  <MessageCircle size={13} style={{ color: COLOR }} />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: `${COLOR}99` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-slate-100 px-3 py-2.5 flex-shrink-0">
            <div className="flex items-end gap-2">
              <button onClick={() => setEmoji((s) => !s)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0 mb-0.5">
                <Smile size={16} />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={resize}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything about MJ.TALK…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400 transition-shadow"
                style={{ maxHeight: 110, minHeight: 36, lineHeight: "1.5" }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || typing}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg,${COLOR},${COLOR}cc)` }}
              >
                <Send size={15} className="text-white" />
              </button>
            </div>

            {showEmoji && (
              <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                {["👋", "😊", "🙏", "✅", "❓", "💰", "🚀", "🤔"].map((e) => (
                  <button key={e} onClick={() => { setInput((v) => v + e); setEmoji(false); inputRef.current?.focus(); }} className="text-lg hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-slate-300 mt-1.5 pb-0.5">
              Powered by <span style={{ color: COLOR }}>MJ.TALK</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Minimized pill ── */}
      {open && minimized && (
        <button
          onClick={() => setMin(false)}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-white shadow-xl hover:opacity-90 active:scale-95 transition-all"
          style={{ background: `linear-gradient(135deg,${COLOR},${COLOR}dd)` }}
        >
          <MessageCircle size={16} />
          <span className="text-sm font-medium">MJ.TALK Support</span>
          {unread > 0 && (
            <span className="bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ color: COLOR }}>{unread}</span>
          )}
        </button>
      )}

      {/* ── Launcher button ── */}
      {!open && (
        <div className="relative">
          <button
            onClick={handleOpen}
            className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: `linear-gradient(135deg,${COLOR},${COLOR}cc)` }}
            aria-label="Chat with MJ.TALK Support"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          {unread > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow">
              {unread > 9 ? "9+" : unread}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes widgetSlideIn {
          from { opacity:0; transform:translateY(16px) scale(.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
