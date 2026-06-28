"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search, MessageSquare, User, Clock, Globe, AlertTriangle,
  CheckCircle2, Send, Bot, ChevronDown, Filter, RefreshCw,
  Circle, Inbox, Tag, ArrowLeft, Sparkles,
  X, Hash, Phone, Mail, Maximize2, Flag, Plus, UserPlus,
  UserCheck, StickyNote, Zap, Shield, WifiOff, History,
  TriangleAlert, CheckCheck, Loader2,
} from "lucide-react";
import { AiHandoffPanel } from "@/components/dashboard/ai-handoff-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, formatDateTime, formatTime, getInitials, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Conversation, Message, ConversationNote } from "@/types";
import { useNotificationContext } from "@/components/dashboard/realtime-notification-provider";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";

/* ─── types ─── */
interface ConversationInboxProps {
  conversations: Conversation[];
  chatbots: Array<{ id: string; name: string; widget_color: string }>;
  selectedConversation: Conversation | null;
  messages: Message[];
  searchParams: { status?: string; id?: string; chatbot?: string; q?: string };
}

interface PreviousConversation {
  id: string;
  status: string;
  message_count: number;
  created_at: string;
  chatbot?: { name: string };
}

/* ─── tiny markdown renderer ─── */
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
  open:      { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500",  label: "Open",      ring: "ring-emerald-400" },
  escalated: { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500",      label: "Escalated", ring: "ring-red-400" },
  resolved:  { color: "bg-slate-100 text-slate-500 border-slate-200",       dot: "bg-slate-400",    label: "Resolved",  ring: "ring-slate-300" },
};

/* ─── priority config ─── */
const PRIORITY = {
  high:   { color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   label: "High"   },
  medium: { color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", label: "Medium" },
  low:    { color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200", label: "Low"    },
};

/* ─── quick-reply templates ─── */
const QUICK_REPLIES = [
  "Thanks for reaching out! Let me look into this for you.",
  "I understand your concern. Could you provide more details?",
  "I've escalated this to our technical team. You'll hear back shortly.",
  "Is there anything else I can help you with?",
  "Your issue has been resolved. Please let us know if you need further assistance.",
];

/* ─── delivery status icon ─── */
function DeliveryIcon({ status }: { status?: string }) {
  if (status === "failed") return <TriangleAlert className="w-3 h-3 text-red-400" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-emerald-400" />;
  return <CheckCheck className="w-3 h-3 text-slate-300" />;
}

/* ─── chat state banner (shown to admin when escalated / waiting) ─── */
function ChatStateBanner({ conversation }: { conversation: Conversation }) {
  if (conversation.status === "escalated") {
    return (
      <div className="mx-4 mb-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
        <TriangleAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-700">Escalated — needs human attention</p>
          {conversation.escalation_requested_at && (
            <p className="text-xs text-red-500 mt-0.5">
              Requested {formatRelativeTime(conversation.escalation_requested_at)}
            </p>
          )}
        </div>
      </div>
    );
  }
  if (!conversation.assigned_agent_id && conversation.status === "open") {
    return (
      <div className="mx-4 mb-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700 font-medium">Unassigned — assign to yourself to respond</p>
      </div>
    );
  }
  return null;
}

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

  /* ── core state ── */
  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState(initialSelected);
  const [messages, setMessages] = useState(initialMessages);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.q ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.status ?? "all");
  const [chatbotFilter, setChatbotFilter] = useState(searchParams.chatbot ?? "all");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [newConvData, setNewConvData] = useState({
    chatbotId: chatbots[0]?.id || "",
    visitorName: "",
    visitorEmail: "",
    initialMessage: "",
  });

  /* ── info sidebar tabs ── */
  const [infoTab, setInfoTab] = useState<"details" | "notes" | "history">("details");
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [assigning, setAssigning] = useState(false);

  /* ── customer history ── */
  const [previousConvs, setPreviousConvs] = useState<PreviousConversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* ── typing indicator ── */
  const [visitorIsTyping, setVisitorIsTyping] = useState(false);
  const { onKeystroke: adminTypingKeystroke, onSend: adminTypingSend } = useTypingIndicator({
    conversationId: selected?.id ?? null,
    selfRole: "admin",
    watchRole: "user",
    onRemoteTyping: setVisitorIsTyping,
  });

  /* ── realtime notification context ── */
  const { decrementUnread } = useNotificationContext();

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

  /* ── Realtime: conversation status/assignment updates ── */
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("inbox_convs")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, (payload) => {
        setConversations((prev) => prev.map((c) => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        if (selected?.id === payload.new.id) setSelected((prev) => prev ? { ...prev, ...payload.new } : prev);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, (payload) => {
        const newConv = payload.new as Conversation;
        setConversations((prev) => {
          if (prev.some((c) => c.id === newConv.id)) return prev;
          return [newConv, ...prev];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  /* ── URL filter helpers ── */
  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const merged = { status: statusFilter, chatbot: chatbotFilter, q: search, ...newParams };
    const params = new URLSearchParams();
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.chatbot && merged.chatbot !== "all") params.set("chatbot", merged.chatbot);
    if (merged.q) params.set("q", merged.q);
    if (selected?.id) params.set("id", selected.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  /* ── Select a conversation ── */
  const selectConversation = async (conv: Conversation) => {
    setSelected(conv);
    setMessages([]);
    setLoadingMessages(true);
    setVisitorIsTyping(false);
    setSendError(null);

    const supabase = getSupabase();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
    setLoadingMessages(false);

    // Mark as seen
    fetch("/api/conversations/mark-seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conv.id }),
    }).then((res) => { if (res.ok) decrementUnread(1); }).catch(() => {});

    const params = new URLSearchParams(window.location.search);
    params.set("id", conv.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /* ── Load notes when notes tab opens ── */
  useEffect(() => {
    if (!showInfo || !selected?.id || infoTab !== "notes") return;
    fetch(`/api/conversations/notes?conversationId=${selected.id}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []))
      .catch(() => {});
  }, [showInfo, infoTab, selected?.id]);

  /* ── Load customer history when history tab opens ── */
  useEffect(() => {
    if (!showInfo || !selected?.id || infoTab !== "history") return;
    if (!selected.visitor_email) { setPreviousConvs([]); return; }
    setLoadingHistory(true);
    fetch(`/api/conversations/customer-history?email=${encodeURIComponent(selected.visitor_email)}&currentId=${selected.id}`)
      .then((r) => r.json())
      .then((d) => setPreviousConvs(d.conversations ?? []))
      .catch(() => { setPreviousConvs([]); })
      .finally(() => setLoadingHistory(false));
  }, [showInfo, infoTab, selected?.id, selected?.visitor_email]);

  /* ── Auto-resize reply textarea ── */
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  /* ── Send admin reply ── */
  const sendAdminReply = async () => {
    if (!replyText.trim() || !selected || sending) return;
    setSending(true);
    setSendError(null);
    adminTypingSend();

    const res = await fetch("/api/admin/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected.id, content: replyText.trim() }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSendError(body.error ?? "Failed to send message. Please try again.");
      toast({ title: "Failed to send", description: body.error, variant: "destructive" });
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
    if (error) {
      toast({ title: "Could not update status", description: error.message, variant: "destructive" });
    } else {
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
        body: JSON.stringify({ conversationId: selected.id, message: "Conversation flagged for review" }),
      });
      if (!res.ok) throw new Error("Failed to flag conversation");
      toast({ title: "Conversation flagged", description: "A notification has been created for your team." });
    } catch (e) {
      toast({ title: "Could not flag", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally { setFlagging(false); }
  };

  /* ── Priority update ── */
  const updatePriority = async (priority: "low" | "medium" | "high") => {
    if (!selected) return;
    const supabase = getSupabase();
    const { error } = await supabase.from("conversations").update({ priority }).eq("id", selected.id);
    if (!error) {
      setSelected((prev) => prev ? { ...prev, priority } : prev);
      setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, priority } : c));
      toast({ title: `Priority set to ${priority}` });
    }
  };

  /* ── Assign to self ── */
  const handleAssignToMe = async () => {
    if (!selected || assigning) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/conversations/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected.id }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      setSelected((prev) => prev ? { ...prev, assigned_agent_id: "me" } : prev);
      toast({ title: "Conversation assigned to you" });
    } catch {
      toast({ title: "Could not assign", variant: "destructive" });
    } finally { setAssigning(false); }
  };

  /* ── Save internal note ── */
  const handleSaveNote = async () => {
    if (!noteText.trim() || !selected || savingNote) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/conversations/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected.id, noteText: noteText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const data = await res.json();
      setNotes((prev) => [...prev, data.note]);
      setNoteText("");
      toast({ title: "Note saved" });
    } catch { toast({ title: "Could not save note", variant: "destructive" }); }
    finally { setSavingNote(false); }
  };

  /* ── Create new conversation (admin-initiated) ── */
  const handleCreateConversation = async () => {
    if (!newConvData.chatbotId || creatingConversation) return;
    setCreatingConversation(true);
    try {
      const res = await fetch("/api/admin/create-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConvData),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to create"); }
      const data = await res.json();
      setConversations((prev) => [data.conversation, ...prev]);
      await selectConversation(data.conversation);
      setShowNewConversation(false);
      setNewConvData({ chatbotId: chatbots[0]?.id || "", visitorName: "", visitorEmail: "", initialMessage: "" });
      toast({ title: "Conversation created" });
    } catch (e) {
      toast({ title: "Could not create conversation", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally { setCreatingConversation(false); }
  };

  /* ── Filtered conversations ── */
  const filtered = conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (chatbotFilter !== "all" && c.chatbot_id !== chatbotFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.visitor_name ?? "").toLowerCase().includes(q) || (c.visitor_email ?? "").toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (a.status === "escalated" && b.status !== "escalated") return -1;
    if (b.status === "escalated" && a.status !== "escalated") return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const openCount      = conversations.filter((c) => c.status === "open").length;
  const escalatedCount = conversations.filter((c) => c.status === "escalated").length;
  const unresolvedCount = conversations.filter((c) => c.status !== "resolved").length;

  const FILTER_TABS = [
    { id: "all",       label: "All",       count: conversations.length,                                          urgent: false },
    { id: "open",      label: "Open",      count: openCount,                                                     urgent: false },
    { id: "escalated", label: "Escalated", count: escalatedCount,                                                urgent: true  },
    { id: "resolved",  label: "Resolved",  count: conversations.filter((c) => c.status === "resolved").length,   urgent: false },
  ];

  /* ══════════════════════════════════════════════
      RENDER
  ══════════════════════════════════════════════ */
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
        <div className="px-4 pt-4 pb-0 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-600" />
              Inbox
              {unresolvedCount > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">
                  {unresolvedCount}
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowNewConversation(true)}
              className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-0 -mx-4 px-2">
            {FILTER_TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setStatusFilter(tab.id); updateFilters({ status: tab.id }); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium border-b-2 transition-colors",
                    isActive
                      ? tab.urgent ? "border-red-500 text-red-600" : "border-emerald-500 text-emerald-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                      isActive && tab.urgent ? "bg-red-100 text-red-600" :
                      isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + chatbot filter */}
        <div className="px-4 py-2.5 border-b border-slate-100 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); updateFilters({ q: e.target.value }); }}
              placeholder="Search by name or email…"
              className="pl-8 h-8 text-xs border-slate-200 bg-slate-50"
            />
            {search && (
              <button onClick={() => { setSearch(""); updateFilters({ q: "" }); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {chatbots.length > 1 && (
            <Select value={chatbotFilter} onValueChange={(v) => { setChatbotFilter(v); updateFilters({ chatbot: v }); }}>
              <SelectTrigger className="h-7 text-xs border-slate-200 w-full">
                <Filter className="w-3 h-3 mr-1 text-slate-400" />
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

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No conversations</p>
              <p className="text-xs text-slate-300 mt-1">
                {search ? "Try a different search term" : "Conversations will appear here when visitors start chatting."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((conv) => {
                const isActive = selected?.id === conv.id;
                const chatbot  = chatbots.find((b) => b.id === conv.chatbot_id);
                const st   = STATUS[conv.status as keyof typeof STATUS] ?? STATUS.open;
                const prio = conv.priority ? PRIORITY[conv.priority as keyof typeof PRIORITY] : null;

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-all",
                      isActive ? "bg-emerald-50 border-r-[3px] border-emerald-500" : "hover:bg-slate-50/80"
                    )}
                  >
                    <div className="flex gap-3 items-start">

                      {/* ── Avatar with status dot ── */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                          style={{ background: chatbot?.widget_color ?? "#0d8585" }}
                        >
                          {(conv.visitor_name ?? "?")[0].toUpperCase()}
                        </div>
                        {/* Status dot — bottom-left, like the reference */}
                        <span className={cn(
                          "absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                          st.dot
                        )} />
                      </div>

                      {/* ── Content ── */}
                      <div className="flex-1 min-w-0">

                        {/* Row 1: name + time */}
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className={cn(
                            "text-sm font-bold truncate",
                            isActive ? "text-emerald-800" : "text-slate-900"
                          )}>
                            {conv.visitor_name ?? "Anonymous"}
                          </span>
                          <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                            {formatRelativeTime(conv.updated_at)}
                          </span>
                        </div>

                        {/* Row 2: chatbot name + status badge */}
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                            <Bot className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {chatbot?.name ?? "Bot"}
                          </span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-semibold border flex-shrink-0",
                            st.color
                          )}>
                            {st.label}
                          </span>
                        </div>

                        {/* Row 3: email */}
                        {conv.visitor_email && (
                          <div className="flex items-center gap-1 mb-0.5">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="text-xs text-slate-400 truncate">{conv.visitor_email}</span>
                          </div>
                        )}

                        {/* Row 4: priority + unassigned */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {prio && (
                            <span className={cn("text-xs font-semibold flex items-center gap-0.5", prio.color)}>
                              <Zap className="w-3 h-3" />{prio.label}
                            </span>
                          )}
                          {!conv.assigned_agent_id && conv.status !== "resolved" && (
                            <span className="text-xs text-slate-400 flex items-center gap-0.5">
                              <User className="w-3 h-3" />Unassigned
                            </span>
                          )}
                        </div>
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
          MIDDLE PANEL — chat thread
      ══════════════════════════════════════════════ */}
      <div className={cn(
        "flex-1 flex min-w-0 bg-slate-50",
        !selected ? "hidden lg:flex items-center justify-center" : "flex flex-col"
      )}>
        {selected ? (
          <>
            {/* ── Chat header ── */}
            <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
              <button className="lg:hidden text-slate-400 hover:text-slate-600 mr-1" onClick={() => setSelected(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="text-white text-xs font-semibold"
                    style={{ background: (selected as Conversation & { chatbot?: { widget_color?: string } }).chatbot?.widget_color ?? "#6366f1" }}>
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
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 flex-wrap">
                  {selected.visitor_email && <>{selected.visitor_email} · </>}
                  {(selected as Conversation & { chatbot?: { name: string } }).chatbot?.name}
                  {selected.assigned_agent_id ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                      <UserCheck className="w-3 h-3" />Assigned to you
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-amber-500 font-medium">
                      <User className="w-3 h-3" />Unassigned
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Priority badge */}
                {selected.priority && selected.priority !== "medium" && (
                  <span className={cn(
                    "hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border",
                    PRIORITY[selected.priority as keyof typeof PRIORITY]?.color,
                    PRIORITY[selected.priority as keyof typeof PRIORITY]?.bg,
                    PRIORITY[selected.priority as keyof typeof PRIORITY]?.border,
                  )}>
                    <Zap className="w-3 h-3" />{selected.priority}
                  </span>
                )}

                {/* Status badge + changer */}
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-semibold",
                  STATUS[selected.status as keyof typeof STATUS]?.color ?? STATUS.open.color
                )}>
                  {STATUS[selected.status as keyof typeof STATUS]?.label ?? selected.status}
                </span>

                <Select value={selected.status} onValueChange={(v) => updateStatus(v as "open" | "escalated" | "resolved")}>
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

                <button
                  onClick={handleFlagConversation}
                  disabled={flagging || selected.status === "resolved"}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Flag for review"
                >
                  <Flag className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setShowInfo((s) => !s); setInfoTab("details"); }}
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

            {/* ── Main area: thread + info sidebar ── */}
            <div className="flex-1 flex min-h-0">

              {/* Messages column */}
              <div className="flex-1 flex flex-col min-w-0">

                {/* Session meta bar */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatDateTime(selected.created_at)}
                  </span>
                  {selected.page_url && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[200px]">
                      <Globe className="w-3 h-3 flex-shrink-0" />{selected.page_url}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3" />{selected.message_count} messages
                  </span>
                  {selected.source && selected.source !== "widget" && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />{selected.source.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                      <span className="ml-2 text-sm text-slate-400">Loading messages…</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400 font-medium">No messages yet</p>
                      <p className="text-xs text-slate-300 mt-1">Send a reply to start the conversation.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-2xl mx-auto">
                      {messages.map((msg, i) => {
                        const isUser  = msg.role === "user";
                        const isAdmin = msg.role === "admin";
                        const isBot   = msg.role === "assistant";
                        const prevSame = i > 0 && messages[i - 1].role === msg.role;
                        const nextSame = i < messages.length - 1 && messages[i + 1].role === msg.role;
                        return (
                          <div key={msg.id} className={cn("flex gap-2.5", isUser ? "justify-start" : "justify-end", prevSame && "mt-0.5")}>
                            {isUser && !prevSame && (
                              <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                                <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-semibold">
                                  {getInitials(selected.visitor_name ?? "?")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {isUser && prevSame && <div className="w-7 flex-shrink-0" />}
                            <div className={cn("max-w-[70%] space-y-0.5", !isUser && "flex flex-col items-end")}>
                              {!prevSame && (
                                <p className={cn("text-xs text-slate-400 px-1", !isUser && "text-right")}>
                                  {isUser && (selected.visitor_name ?? "Visitor")}
                                  {isBot && <span className="flex items-center gap-1 justify-end"><Sparkles className="w-3 h-3" />AI Assistant</span>}
                                  {isAdmin && "You (Agent)"}
                                </p>
                              )}
                              <div
                                className={cn(
                                  "px-3.5 py-2.5 text-sm leading-relaxed break-words",
                                  isUser ? cn("bg-white border border-slate-200 text-slate-800 shadow-sm", !prevSame ? "rounded-2xl rounded-tl-sm" : "rounded-2xl", nextSame && "rounded-bl-sm")
                                    : cn("text-white shadow-sm", isBot ? "bg-emerald-600" : "bg-slate-700", !prevSame ? "rounded-2xl rounded-tr-sm" : "rounded-2xl", nextSame && "rounded-br-sm")
                                )}
                                {...(isUser ? {} : { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } })}
                              >
                                {isUser ? msg.content : undefined}
                              </div>
                              {!nextSame && (
                                <div className={cn("flex items-center gap-1 px-1", !isUser && "justify-end")}>
                                  <p className="text-xs text-slate-300">{formatTime(msg.created_at)}</p>
                                  {isAdmin && <DeliveryIcon status={msg.delivery_status} />}
                                </div>
                              )}
                            </div>
                            {!isUser && !prevSame && (
                              <Avatar className="h-7 w-7 flex-shrink-0 mt-1 order-last">
                                <AvatarFallback className={cn("text-white text-xs", isBot ? "bg-emerald-500" : "bg-slate-600")}>
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

                {/* Visitor typing indicator */}
                {visitorIsTyping && (
                  <div className="mx-4 mb-1 flex items-center gap-2 text-xs text-slate-400">
                    <div className="flex gap-0.5 items-center">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-slate-300 typing-dot" />
                      ))}
                    </div>
                    <span>Visitor is typing…</span>
                  </div>
                )}

                {/* AI Handoff Summary — auto-loads for escalated chats */}
                <AiHandoffPanel
                  conversationId={selected.id}
                  isEscalated={selected.status === "escalated"}
                  onUseSuggestion={(text) => {
                    setReplyText(text);
                    if (replyRef.current) {
                      replyRef.current.style.height = "auto";
                      replyRef.current.style.height = Math.min(replyRef.current.scrollHeight, 140) + "px";
                      replyRef.current.focus();
                    }
                  }}
                />

                {/* Status banners */}
                <ChatStateBanner conversation={selected} />

                {/* Send error */}
                {sendError && (
                  <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700 flex-1">{sendError}</p>
                    <button onClick={() => setSendError(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Reply box */}
                <div className="bg-white border-t border-slate-100 px-4 py-3 flex-shrink-0">
                  {showQuickReplies && (
                    <div className="mb-2 flex gap-1.5 flex-wrap">
                      {QUICK_REPLIES.map((qr, i) => (
                        <button key={i}
                          onClick={() => { setReplyText(qr); setShowQuickReplies(false); replyRef.current?.focus(); }}
                          className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full transition-colors border border-slate-200 hover:border-emerald-200">
                          {qr.length > 42 ? qr.slice(0, 42) + "…" : qr}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end max-w-2xl mx-auto">
                    <button
                      onClick={() => setShowQuickReplies((s) => !s)}
                      className={cn(
                        "h-9 px-2.5 flex items-center gap-1 rounded-xl text-xs font-medium transition-colors flex-shrink-0",
                        showQuickReplies ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                        onChange={(e) => { handleReplyChange(e); adminTypingKeystroke(); setSendError(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdminReply(); }
                        }}
                        placeholder={selected.status === "resolved" ? "Conversation is resolved — reopen to reply" : "Reply to visitor…"}
                        disabled={selected.status === "resolved"}
                        rows={1}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: "40px" }}
                      />
                    </div>

                    <Button
                      onClick={sendAdminReply}
                      disabled={!replyText.trim() || sending || selected.status === "resolved"}
                      className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0 rounded-xl flex-shrink-0 shadow-sm"
                    >
                      {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between max-w-2xl mx-auto mt-1.5">
                    <p className="text-xs text-slate-300">Enter to send · Shift+Enter for new line</p>
                    {selected.status === "resolved" && (
                      <button onClick={() => updateStatus("open")}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                        <Circle className="w-3 h-3" />Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RIGHT PANEL: info / notes / history ── */}
              {showInfo && selected && <InfoSidebar
                selected={selected}
                infoTab={infoTab}
                setInfoTab={setInfoTab}
                onClose={() => setShowInfo(false)}
                notes={notes}
                noteText={noteText}
                setNoteText={setNoteText}
                savingNote={savingNote}
                onSaveNote={handleSaveNote}
                assigning={assigning}
                onAssignToMe={handleAssignToMe}
                onUnassign={async () => {
                  await fetch("/api/conversations/assign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ conversationId: selected.id, agentId: null }),
                  });
                  setSelected((prev) => prev ? { ...prev, assigned_agent_id: null } : prev);
                  toast({ title: "Unassigned" });
                }}
                onUpdatePriority={updatePriority}
                onUpdateStatus={updateStatus}
                previousConvs={previousConvs}
                loadingHistory={loadingHistory}
              />}
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
                Pick a conversation from the inbox to view messages and reply in real time.
              </p>
              {conversations.length === 0 && (
                <p className="text-xs text-slate-300 mt-3 border border-slate-100 rounded-xl p-3 bg-slate-50">
                  No conversations yet. Deploy a chatbot to start receiving messages.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          NEW CONVERSATION MODAL
      ══════════════════════════════════════════════ */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-600" />New Conversation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Start a conversation with a visitor</p>
                </div>
                <button onClick={() => setShowNewConversation(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Chatbot *</label>
                <Select value={newConvData.chatbotId} onValueChange={(v) => setNewConvData((p) => ({ ...p, chatbotId: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select chatbot" />
                  </SelectTrigger>
                  <SelectContent>
                    {chatbots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bot.widget_color }} />
                          {bot.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Visitor Name</label>
                <Input placeholder="Test User" value={newConvData.visitorName}
                  onChange={(e) => setNewConvData((p) => ({ ...p, visitorName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Email (optional)</label>
                <Input type="email" placeholder="test@example.com" value={newConvData.visitorEmail}
                  onChange={(e) => setNewConvData((p) => ({ ...p, visitorEmail: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Initial Message (optional)</label>
                <textarea
                  placeholder="Hi, I need help with..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={3}
                  value={newConvData.initialMessage}
                  onChange={(e) => setNewConvData((p) => ({ ...p, initialMessage: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewConversation(false)} disabled={creatingConversation}>
                Cancel
              </Button>
              <Button onClick={handleCreateConversation} disabled={!newConvData.chatbotId || creatingConversation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {creatingConversation
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                  : <><Plus className="w-4 h-4 mr-2" />Create</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
    INFO SIDEBAR — Customer Details, Notes, History
    Extracted so the main component stays readable
══════════════════════════════════════════════ */
interface InfoSidebarProps {
  selected: Conversation;
  infoTab: "details" | "notes" | "history";
  setInfoTab: (t: "details" | "notes" | "history") => void;
  onClose: () => void;
  notes: ConversationNote[];
  noteText: string;
  setNoteText: (v: string) => void;
  savingNote: boolean;
  onSaveNote: () => void;
  assigning: boolean;
  onAssignToMe: () => void;
  onUnassign: () => void;
  onUpdatePriority: (p: "low" | "medium" | "high") => void;
  onUpdateStatus: (s: "open" | "escalated" | "resolved") => void;
  previousConvs: PreviousConversation[];
  loadingHistory: boolean;
}
function InfoSidebar({
  selected, infoTab, setInfoTab, onClose,
  notes, noteText, setNoteText, savingNote, onSaveNote,
  assigning, onAssignToMe, onUnassign,
  onUpdatePriority, onUpdateStatus,
  previousConvs, loadingHistory,
}: InfoSidebarProps) {
  const tabs = [
    { id: "details" as const, label: "Details",  icon: User },
    { id: "notes"   as const, label: "Notes",    icon: StickyNote },
    { id: "history" as const, label: "History",  icon: History },
  ];

  const statusColor: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-700",
    escalated: "bg-red-100 text-red-700",
    resolved: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="w-72 flex-shrink-0 border-l border-slate-100 bg-white flex flex-col overflow-hidden">

      {/* Header + tabs */}
      <div className="px-4 pt-4 pb-0 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {infoTab === "details" ? "Visitor Info" : infoTab === "notes" ? "Internal Notes" : "Chat History"}
          </p>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex gap-0 -mx-4 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setInfoTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium border-b-2 transition-colors",
                infoTab === tab.id ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-3 h-3" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── DETAILS TAB ── */}
        {infoTab === "details" && (
          <div className="space-y-4">
            {/* Avatar card */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-white font-semibold"
                  style={{ background: (selected as Conversation & { chatbot?: { widget_color?: string } }).chatbot?.widget_color ?? "#6366f1" }}>
                  {getInitials(selected.visitor_name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{selected.visitor_name ?? "Anonymous"}</p>
                <p className="text-xs text-slate-400 truncate">{selected.visitor_email ?? "No email"}</p>
              </div>
            </div>

            {/* Detail rows */}
            <div className="space-y-2.5">
              {[
                { icon: Mail,  label: "Email",    value: selected.visitor_email ?? "—" },
                { icon: Clock, label: "Started",  value: formatDateTime(selected.created_at) },
                { icon: Hash,  label: "Messages", value: String(selected.message_count ?? 0) },
                { icon: Globe, label: "Page",     value: selected.page_url ? decodeURIComponent(selected.page_url).slice(0, 38) : "—" },
                { icon: Phone, label: "Browser",  value: selected.browser_info ? selected.browser_info.slice(0, 34) + "…" : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-2.5">
                  <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-xs font-medium text-slate-700 break-all">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Intent */}
            <IntentBadgeSection conversationId={selected.id} />

            {/* Priority */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3" />Priority
              </p>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as const).map((p) => {
                  const isCurrent = (selected.priority ?? "medium") === p;
                  const cfg = PRIORITY[p];
                  return (
                    <button
                      key={p}
                      onClick={() => onUpdatePriority(p)}
                      className={cn(
                        "flex-1 text-xs py-1.5 rounded-lg font-semibold capitalize transition-colors border",
                        isCurrent ? `${cfg.color} ${cfg.bg} border-transparent` : "bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-200"
                      )}
                    >{p}</button>
                  );
                })}
              </div>
            </div>

            {/* Assignment */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />Assignment
              </p>
              {selected.assigned_agent_id ? (
                <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />Assigned to you
                  </span>
                  <button onClick={onUnassign} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                    Unassign
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAssignToMe}
                  disabled={assigning}
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors font-medium"
                >
                  {assigning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                  Assign to me
                </button>
              )}
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />Status
              </p>
              <div className="space-y-1.5">
                {(["open", "escalated", "resolved"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateStatus(s)}
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
            </div>

            <Link href={`/dashboard/conversations?id=${selected.id}`}
              className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              <Maximize2 className="w-3 h-3" />Open full view
            </Link>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {infoTab === "notes" && (
          <div className="flex flex-col gap-3">
            {notes.length === 0 ? (
              <div className="text-center py-8">
                <StickyNote className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No internal notes yet</p>
                <p className="text-xs text-slate-300 mt-0.5">Notes are only visible to your team.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs text-slate-700 leading-relaxed">{note.note_text}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {note.agent?.email ?? "Agent"} · {formatRelativeTime(note.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-slate-100 pt-3 mt-1">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add internal note… (not visible to customer)"
                rows={3}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-slate-50 placeholder:text-slate-400"
              />
              <button
                onClick={onSaveNote}
                disabled={!noteText.trim() || savingNote}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <StickyNote className="w-3 h-3" />}
                Save Note
              </button>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {infoTab === "history" && (
          <div className="space-y-3">
            {!selected.visitor_email ? (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No email on file</p>
                <p className="text-xs text-slate-300 mt-0.5">History requires a visitor email address.</p>
              </div>
            ) : loadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                <span className="ml-2 text-xs text-slate-400">Loading history…</span>
              </div>
            ) : previousConvs.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">First conversation</p>
                <p className="text-xs text-slate-300 mt-0.5">No previous chats for this visitor.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 font-semibold">
                  {previousConvs.length} previous chat{previousConvs.length !== 1 ? "s" : ""} · {selected.visitor_email}
                </p>
                <div className="space-y-2">
                  {previousConvs.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/dashboard/conversations?id=${conv.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">
                          {conv.chatbot?.name ?? "Chat"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatRelativeTime(conv.created_at)} · {conv.message_count} msgs
                        </p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2", statusColor[conv.status] ?? "bg-slate-100 text-slate-500")}>
                        {conv.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
    INTENT BADGE SECTION
    Lazy-loads ai_session data for a conversation
    and displays the detected intent inline in
    the Details tab of the info sidebar.
══════════════════════════════════════════════ */
const INTENT_COLORS: Record<string, string> = {
  refund:    "bg-amber-100 text-amber-700 border-amber-200",
  billing:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  account:   "bg-purple-100 text-purple-700 border-purple-200",
  technical: "bg-red-100 text-red-700 border-red-200",
  complaint: "bg-orange-100 text-orange-700 border-orange-200",
  setup:     "bg-indigo-100 text-indigo-700 border-indigo-200",
  general:   "bg-slate-100 text-slate-600 border-slate-200",
  other:     "bg-slate-100 text-slate-600 border-slate-200",
};

function IntentBadgeSection({ conversationId }: { conversationId: string }) {
  const [intent, setIntent]       = useState<string | null>(null);
  const [confidence, setConf]     = useState<number | null>(null);
  const [loaded, setLoaded]       = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    // Direct Supabase fetch via browser client
    async function load() {
      try {
        const { createBrowserClient } = await import("@supabase/ssr");
        const sb = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await sb
          .from("ai_sessions")
          .select("intent_label, intent_confidence")
          .eq("conversation_id", conversationId)
          .maybeSingle();
        if (data?.intent_label) {
          setIntent(data.intent_label);
          setConf(data.intent_confidence ?? null);
        }
      } catch { /* non-critical */ }
    }
    load();
  }, [conversationId, loaded]);

  if (!intent) return null;

  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />AI Intent
      </p>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs px-2.5 py-1 rounded-full font-semibold border capitalize",
          INTENT_COLORS[intent] ?? INTENT_COLORS.general
        )}>
          {intent}
        </span>
        {confidence !== null && (
          <span className="text-xs text-slate-400">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
    </div>
  );
}
