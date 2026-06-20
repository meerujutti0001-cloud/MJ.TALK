"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search, MessageSquare, User, Clock, Globe, AlertTriangle,
  CheckCircle2, Send, Bot, ChevronDown, Filter, RefreshCw,
  Circle, MoreVertical, Inbox, Tag, ArrowLeft, Sparkles,
  X, Hash, Phone, Mail, Maximize2, Flag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, formatDateTime, formatTime, getInitials, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Conversation, Message } from "@/types";

/* ─── types ─── */
interface ConversationInboxProps {
  conversations: Conversation[];
  chatbots: Array<{ id: string; name: string; widget_color: string }>;
  selectedConversation: Conversation | null;
  messages: Message[];
  searchParams: { status?: string; id?: string; chatbot?: string; q?: string };
}

/* ─── tiny markdown renderer (same as widget) ─── */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-white/20 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="underline hover:no-underline">$1</a>')
    .replace(/\n/g, "<br/>");
}

/* ─── status config ─── */
const STATUS = {
  open:      { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Open" },
  escalated: { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500",     label: "Escalated" },
  resolved:  { color: "bg-slate-100 text-slate-500 border-slate-200",       dot: "bg-slate-400",   label: "Resolved" },
};

/* ─── quick-reply templates ─── */
const QUICK_REPLIES = [
  "Thanks for reaching out! Let me look into this for you.",
  "I understand your concern. Could you provide more details?",
  "I've escalated this to our technical team. You'll hear back shortly.",
  "Is there anything else I can help you with?",
  "Your issue has been resolved. Please let us know if you need further assistance.",
];

export function ConversationInbox({
  conversations: initialConversations,
  chatbots,
  selectedConversation: initialSelected,
  messages: initialMessages,
  searchParams,
}: ConversationInboxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState(initialSelected);
  const [messages, setMessages] = useState(initialMessages);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState(searchParams.q ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.status ?? "all");
  const [chatbotFilter, setChatbotFilter] = useState(searchParams.chatbot ?? "all");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [flagging, setFlagging] = useState(false);

  /* ── scroll ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* ── Realtime: new messages in selected conversation ── */
  useEffect(() => {
    if (!selected?.id) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`inbox_msgs:${selected.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  /* ── Realtime: conversation status/updates ── */
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("inbox_convs")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          setConversations((prev) =>
            prev.map((c) => c.id === payload.new.id ? { ...c, ...payload.new } : c)
          );
          if (selected?.id === payload.new.id) {
            setSelected((prev) => prev ? { ...prev, ...payload.new } : prev);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const newConv = payload.new as Conversation;
          // Add to list if matches current chatbot filter
          setConversations((prev) => {
            if (prev.some((c) => c.id === newConv.id)) return prev;
            return [newConv, ...prev];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  /* ── URL/filter helpers ── */
  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const merged = { status: statusFilter, chatbot: chatbotFilter, q: search, ...newParams };
    const params = new URLSearchParams();
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.chatbot && merged.chatbot !== "all") params.set("chatbot", merged.chatbot);
    if (merged.q) params.set("q", merged.q);
    if (selected?.id) params.set("id", selected.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectConversation = async (conv: Conversation) => {
    setSelected(conv);
    setMessages([]);
    setLoadingMessages(true);

    const supabase = getSupabase();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
    setLoadingMessages(false);

    const params = new URLSearchParams(window.location.search);
    params.set("id", conv.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /* ── Auto-resize reply textarea ── */
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  /* ── Send admin reply ── */
  const sendAdminReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);

    const res = await fetch("/api/admin/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected.id, content: replyText.trim() }),
    });

    if (!res.ok) {
      toast({ title: "Failed to send", variant: "destructive" });
    } else {
      setReplyText("");
      if (replyRef.current) replyRef.current.style.height = "auto";
      setShowQuickReplies(false);
    }
    setSending(false);
  };

  /* ── Status update ── */
  const updateStatus = async (status: "open" | "escalated" | "resolved") => {
    if (!selected) return;
    const supabase = getSupabase();
    const { error } = await supabase.from("conversations").update({ status }).eq("id", selected.id);
    if (!error) {
      setSelected((prev) => prev ? { ...prev, status } : prev);
      setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status } : c));
      toast({ title: `Marked as ${status}` });
    }
  };

  /* ── Flag conversation ── */
  const handleFlagConversation = async () => {
    if (!selected || flagging) return;
    setFlagging(true);

    try {
      const res = await fetch("/api/conversations/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          conversationId: selected.id,
          message: `Conversation flagged for review`
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to flag conversation");
      }

      toast({ 
        title: "Conversation flagged",
        description: "A notification has been created for your team.",
      });
    } catch (error) {
      toast({ 
        title: "Failed to flag", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setFlagging(false);
    }
  };

  /* ── Filtered conversations (client-side for search) ── */
  const filtered = conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (chatbotFilter !== "all" && c.chatbot_id !== chatbotFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.visitor_name ?? "").toLowerCase().includes(q) ||
        (c.visitor_email ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ── Stats badges ── */
  const openCount = conversations.filter((c) => c.status === "open").length;
  const escalatedCount = conversations.filter((c) => c.status === "escalated").length;

  return (
    <div className="flex h-full bg-white overflow-hidden">

      {/* ══════════════════════════════════════════════
          LEFT PANEL — conversation list
      ══════════════════════════════════════════════ */}
      <div className={cn(
        "w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-slate-200",
        selected && "hidden lg:flex"
      )}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-600" />
              Inbox
            </h2>
            <div className="flex items-center gap-1.5">
              {escalatedCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {escalatedCount} escalated
                </span>
              )}
              {openCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {openCount} open
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); updateFilters({ q: e.target.value }); }}
              placeholder="Search by name or email…"
              className="pl-8 h-8 text-xs border-slate-200 bg-slate-50"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); updateFilters({ q: "" }); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex gap-1.5">
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); updateFilters({ status: v }); }}
            >
              <SelectTrigger className="h-7 text-xs flex-1 border-slate-200">
                <Filter className="w-3 h-3 mr-1 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {chatbots.length > 1 && (
              <Select
                value={chatbotFilter}
                onValueChange={(v) => { setChatbotFilter(v); updateFilters({ chatbot: v }); }}
              >
                <SelectTrigger className="h-7 text-xs flex-1 border-slate-200">
                  <SelectValue placeholder="All Bots" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bots</SelectItem>
                  {chatbots.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No conversations</p>
              <p className="text-xs text-slate-300 mt-1">
                {search ? "Try a different search" : "They'll appear here when visitors start chatting."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((conv) => {
                const isActive = selected?.id === conv.id;
                const chatbot = chatbots.find((b) => b.id === conv.chatbot_id);
                const st = STATUS[conv.status as keyof typeof STATUS] ?? STATUS.open;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 transition-all group relative",
                      isActive
                        ? "bg-emerald-50 border-r-[3px] border-emerald-500"
                        : "hover:bg-slate-50"
                    )}
                  >
                    {/* Escalated alert dot */}
                    {conv.status === "escalated" && (
                      <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className="text-white text-xs font-semibold"
                            style={{ background: chatbot?.widget_color ?? "#6366f1" }}
                          >
                            {getInitials(conv.visitor_name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white", st.dot)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {conv.visitor_name ?? "Anonymous"}
                          </span>
                          <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                            {formatRelativeTime(conv.updated_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Bot className="w-3 h-3 text-slate-300 flex-shrink-0" />
                          <span className="text-xs text-slate-500 truncate flex-1">
                            {chatbot?.name ?? "Unknown bot"}
                          </span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0",
                            st.color
                          )}>
                            {st.label}
                          </span>
                        </div>

                        {conv.visitor_email && (
                          <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                            {conv.visitor_email}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — chat thread
      ══════════════════════════════════════════════ */}
      <div className={cn(
        "flex-1 flex min-w-0 bg-slate-50",
        !selected ? "hidden lg:flex items-center justify-center" : "flex flex-col"
      )}>
        {selected ? (
          <>
            {/* ── Conversation header ── */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
              {/* Back (mobile) */}
              <button
                className="lg:hidden text-slate-400 hover:text-slate-600 mr-1"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback
                    className="text-white text-xs font-semibold"
                    style={{ background: (selected as Conversation & { chatbot?: { widget_color?: string } }).chatbot?.widget_color ?? "#6366f1" }}
                  >
                    {getInitials(selected.visitor_name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                  STATUS[selected.status as keyof typeof STATUS]?.dot ?? "bg-slate-400"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {selected.visitor_name ?? "Anonymous Visitor"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {selected.visitor_email
                    ? <>{selected.visitor_email} · </>
                    : null}
                  {(selected as Conversation & { chatbot?: { name: string } }).chatbot?.name}
                </p>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-semibold",
                  STATUS[selected.status as keyof typeof STATUS]?.color ?? STATUS.open.color
                )}>
                  {STATUS[selected.status as keyof typeof STATUS]?.label ?? selected.status}
                </span>

                <Select
                  value={selected.status}
                  onValueChange={(v) => updateStatus(v as "open" | "escalated" | "resolved")}
                >
                  <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent focus:ring-0 shrink-0">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="open">
                      <span className="flex items-center gap-2"><Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" /> Open</span>
                    </SelectItem>
                    <SelectItem value="escalated">
                      <span className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-red-500" /> Escalated</span>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-slate-400" /> Resolved</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Flag button */}
                <button
                  onClick={handleFlagConversation}
                  disabled={flagging || selected.status === "resolved"}
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-lg transition-colors",
                    "text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title="Flag for review"
                >
                  <Flag className="w-4 h-4" />
                </button>

                {/* Info toggle */}
                <button
                  onClick={() => setShowInfo((s) => !s)}
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-lg transition-colors",
                    showInfo ? "bg-emerald-100 text-emerald-600" : "text-slate-400 hover:bg-slate-100"
                  )}
                  title="Visitor info"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Main area: messages + optional info sidebar ── */}
            <div className="flex-1 flex min-h-0">

              {/* Messages column */}
              <div className="flex-1 flex flex-col min-w-0">

                {/* Session meta bar */}
                <div className="bg-white/70 backdrop-blur-sm border-b border-slate-100 px-4 py-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(selected.created_at)}
                  </span>
                  {selected.page_url && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[200px]">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      {selected.page_url}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {selected.message_count} messages
                  </span>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-5 h-5 text-slate-300 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-12">No messages yet.</p>
                  ) : (
                    <div className="space-y-3 max-w-2xl mx-auto">
                      {messages.map((msg, i) => {
                        const isUser = msg.role === "user";
                        const isAdmin = msg.role === "admin";
                        const isBot = msg.role === "assistant";

                        // Group consecutive messages from same sender
                        const prevSame = i > 0 && messages[i - 1].role === msg.role;
                        const nextSame = i < messages.length - 1 && messages[i + 1].role === msg.role;

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-2.5",
                              isUser ? "justify-start" : "justify-end",
                              prevSame && "mt-0.5"
                            )}
                          >
                            {isUser && !prevSame && (
                              <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                                <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-semibold">
                                  {getInitials(selected.visitor_name ?? "?")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {isUser && prevSame && <div className="w-7 flex-shrink-0" />}

                            <div className={cn("max-w-[70%] space-y-0.5", !isUser && "flex flex-col items-end")}>
                              {/* Sender label */}
                              {!prevSame && (
                                <p className={cn(
                                  "text-xs text-slate-400 px-1",
                                  !isUser && "text-right"
                                )}>
                                  {isUser && (selected.visitor_name ?? "Visitor")}
                                  {isBot && (
                                    <span className="flex items-center gap-1 justify-end">
                                      <Sparkles className="w-3 h-3" />AI Assistant
                                    </span>
                                  )}
                                  {isAdmin && "You (Agent)"}
                                </p>
                              )}

                              <div
                                className={cn(
                                  "px-3.5 py-2.5 text-sm leading-relaxed break-words",
                                  // Shape: round corners except the "corner" closest to avatar
                                  isUser
                                    ? cn(
                                        "bg-white border border-slate-200 text-slate-800 shadow-sm",
                                        !prevSame ? "rounded-2xl rounded-tl-sm" : "rounded-2xl",
                                        nextSame && "rounded-bl-sm"
                                      )
                                    : cn(
                                        "text-white shadow-sm",
                                        isBot
                                          ? "bg-emerald-600"
                                          : "bg-slate-700",
                                        !prevSame ? "rounded-2xl rounded-tr-sm" : "rounded-2xl",
                                        nextSame && "rounded-br-sm"
                                      )
                                )}
                                {...(isUser
                                  ? {}
                                  : { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }
                                )}
                              >
                                {isUser ? msg.content : undefined}
                              </div>

                              {/* Time — only on last in a group */}
                              {!nextSame && (
                                <p className={cn("text-xs text-slate-300 px-1", !isUser && "text-right")}>
                                  {formatTime(msg.created_at)}
                                </p>
                              )}
                            </div>

                            {!isUser && !prevSame && (
                              <Avatar className="h-7 w-7 flex-shrink-0 mt-1 order-last">
                                <AvatarFallback className={cn(
                                  "text-white text-xs",
                                  isBot ? "bg-emerald-500" : "bg-slate-600"
                                )}>
                                  {isBot ? <Bot className="w-3.5 h-3.5" /> : "Me"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {!isUser && prevSame && <div className="w-7 flex-shrink-0 order-last" />}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Escalation banner */}
                {selected.status === "escalated" && (
                  <div className="mx-4 mb-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-xs font-medium">This conversation was escalated and needs human attention.</span>
                    <button
                      onClick={() => updateStatus("resolved")}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark resolved
                    </button>
                  </div>
                )}

                {/* Reply box */}
                <div className="bg-white border-t border-slate-100 px-4 py-3 flex-shrink-0">
                  {/* Quick replies strip */}
                  {showQuickReplies && (
                    <div className="mb-2 flex gap-1.5 flex-wrap">
                      {QUICK_REPLIES.map((qr, i) => (
                        <button
                          key={i}
                          onClick={() => { setReplyText(qr); setShowQuickReplies(false); replyRef.current?.focus(); }}
                          className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full transition-colors border border-slate-200 hover:border-emerald-200"
                        >
                          {qr.length > 40 ? qr.slice(0, 40) + "…" : qr}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end max-w-2xl mx-auto">
                    {/* Quick replies toggle */}
                    <button
                      onClick={() => setShowQuickReplies((s) => !s)}
                      className={cn(
                        "h-9 px-2.5 flex items-center gap-1 rounded-xl text-xs font-medium transition-colors flex-shrink-0",
                        showQuickReplies
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      )}
                      title="Quick replies"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Quick</span>
                    </button>

                    <div className="flex-1 relative">
                      <textarea
                        ref={replyRef}
                        value={replyText}
                        onChange={handleReplyChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendAdminReply();
                          }
                        }}
                        placeholder="Reply to visitor…"
                        rows={1}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 transition-shadow"
                        style={{ minHeight: "40px" }}
                      />
                    </div>

                    <Button
                      onClick={sendAdminReply}
                      disabled={!replyText.trim() || sending}
                      className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0 rounded-xl flex-shrink-0 shadow-sm"
                    >
                      {sending
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </Button>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 max-w-2xl mx-auto">
                    Enter to send · Shift+Enter for new line · Messages appear instantly to the visitor
                  </p>
                </div>
              </div>

              {/* ── Optional visitor info sidebar ── */}
              {showInfo && (
                <div className="w-64 flex-shrink-0 border-l border-slate-100 bg-white overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Visitor Info</p>
                      <button onClick={() => setShowInfo(false)} className="text-slate-300 hover:text-slate-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className="text-white font-semibold"
                          style={{ background: (selected as Conversation & { chatbot?: { widget_color?: string } }).chatbot?.widget_color ?? "#6366f1" }}
                        >
                          {getInitials(selected.visitor_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {selected.visitor_name ?? "Anonymous"}
                        </p>
                        <p className="text-xs text-slate-400">{selected.visitor_email ?? "No email"}</p>
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="space-y-3">
                      {[
                        { icon: Mail, label: "Email", value: selected.visitor_email ?? "—" },
                        { icon: Clock, label: "Started", value: formatDateTime(selected.created_at) },
                        { icon: Hash, label: "Messages", value: String(selected.message_count) },
                        { icon: Globe, label: "Page", value: selected.page_url ? decodeURIComponent(selected.page_url).slice(0, 40) : "—" },
                        { icon: Phone, label: "Browser", value: selected.browser_info ? selected.browser_info.slice(0, 35) + "…" : "—" },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex gap-2.5">
                          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">{label}</p>
                            <p className="text-xs font-medium text-slate-700 break-all">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Status quick-actions */}
                    <div className="mt-5 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Actions</p>
                      {(["open", "escalated", "resolved"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(s)}
                          disabled={selected.status === s}
                          className={cn(
                            "w-full text-left text-xs px-3 py-2 rounded-xl border font-medium transition-colors",
                            selected.status === s
                              ? cn(STATUS[s].color, "cursor-default opacity-80")
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span className={cn("inline-block w-2 h-2 rounded-full mr-2", STATUS[s].dot)} />
                          Mark as {STATUS[s].label}
                        </button>
                      ))}
                    </div>

                    {/* View full conversation link */}
                    <Link
                      href={`/dashboard/conversations?id=${selected.id}`}
                      className="flex items-center gap-1.5 mt-4 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      <Maximize2 className="w-3 h-3" />
                      Open full view
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">Select a conversation</h3>
              <p className="text-sm text-slate-400">
                Pick a conversation from the inbox to view and reply to messages in real time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
