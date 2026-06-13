"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  User,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle,
  Send,
  Bot,
  ChevronDown,
  Filter,
  RefreshCw,
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

interface ConversationInboxProps {
  conversations: Conversation[];
  chatbots: Array<{ id: string; name: string; widget_color: string }>;
  selectedConversation: Conversation | null;
  messages: Message[];
  searchParams: { status?: string; id?: string; chatbot?: string; q?: string };
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-700 border-green-200",
  escalated: "bg-red-100 text-red-700 border-red-200",
  resolved: "bg-slate-100 text-slate-600 border-slate-200",
};

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

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime: listen for new messages in selected conversation
  useEffect(() => {
    if (!selected?.id) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`messages:${selected.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("conversations:inbox")
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
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status: statusFilter, chatbot: chatbotFilter, q: search, ...newParams };
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.chatbot && merged.chatbot !== "all") params.set("chatbot", merged.chatbot);
    if (merged.q) params.set("q", merged.q);
    if (selected?.id) params.set("id", selected.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectConversation = async (conv: Conversation) => {
    setSelected(conv);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);

    const params = new URLSearchParams(window.location.search);
    params.set("id", conv.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
    }
    setSending(false);
  };

  const updateStatus = async (status: "open" | "escalated" | "resolved") => {
    if (!selected) return;
    const supabase = getSupabase();
    const { error } = await supabase
      .from("conversations")
      .update({ status })
      .eq("id", selected.id);
    if (!error) {
      setSelected((prev) => prev ? { ...prev, status } : prev);
      setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status } : c));
      toast({ title: `Marked as ${status}` });
    }
  };

  return (
    <div className="flex h-full">
      {/* Left panel — conversation list */}
      <div className={cn(
        "w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white",
        selected && "hidden lg:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Conversations</h2>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateFilters({ q: search })}
              placeholder="Search conversations..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); updateFilters({ status: v }); }}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            {chatbots.length > 1 && (
              <Select value={chatbotFilter} onValueChange={(v) => { setChatbotFilter(v); updateFilters({ chatbot: v }); }}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Bot" />
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
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((conv) => {
                const isActive = selected?.id === conv.id;
                const chatbot = chatbots.find((b) => b.id === conv.chatbot_id);
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors",
                      isActive && "bg-emerald-50 border-r-2 border-emerald-500"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                        <AvatarFallback
                          className="text-white text-xs"
                          style={{ backgroundColor: chatbot?.widget_color ?? "#6366f1" }}
                        >
                          {getInitials(conv.visitor_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium text-slate-800 truncate">
                            {conv.visitor_name ?? "Anonymous"}
                          </span>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {formatRelativeTime(conv.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500 truncate flex-1">
                            {chatbot?.name ?? "Unknown bot"}
                          </span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0",
                            STATUS_COLORS[conv.status]
                          )}>
                            {conv.status}
                          </span>
                        </div>
                        {conv.visitor_email && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{conv.visitor_email}</p>
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

      {/* Right panel — chat thread */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50 min-w-0",
        !selected && "hidden lg:flex"
      )}>
        {selected ? (
          <>
            {/* Conversation header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
              <button
                className="lg:hidden text-slate-500 hover:text-slate-700 mr-1"
                onClick={() => setSelected(null)}
              >
                ←
              </button>
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback
                  className="text-white text-xs"
                  style={{ backgroundColor: (selected as Conversation & { chatbot?: { widget_color?: string } }).chatbot?.widget_color ?? "#6366f1" }}
                >
                  {getInitials(selected.visitor_name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {selected.visitor_name ?? "Anonymous Visitor"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {selected.visitor_email ?? "No email"} • {(selected as Conversation & { chatbot?: { name: string } }).chatbot?.name}
                </p>
              </div>
              {/* Status actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn("text-xs px-2 py-1 rounded-full border font-medium", STATUS_COLORS[selected.status])}>
                  {selected.status}
                </span>
                <Select value={selected.status} onValueChange={(v) => updateStatus(v as "open" | "escalated" | "resolved")}>
                  <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent focus:ring-0">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Session info bar */}
            <div className="bg-white border-b border-slate-100 px-4 py-2 flex flex-wrap gap-x-4 gap-y-1">
              {selected.page_url && (
                <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-xs">
                  <Globe className="w-3 h-3 flex-shrink-0" />
                  {selected.page_url}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started {formatDateTime(selected.created_at)}
              </span>
              {selected.browser_info && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {selected.browser_info}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {selected.message_count} messages
              </span>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl mx-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No messages yet.</p>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const isAdmin = msg.role === "admin";
                    const isBot = msg.role === "assistant";

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2", isUser ? "justify-start" : "justify-end")}
                      >
                        {isUser && (
                          <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                              {getInitials(selected.visitor_name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn("max-w-[70%] space-y-1")}>
                          <div
                            className={cn(
                              "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                              isUser && "bg-white border border-slate-200 text-slate-800 rounded-tl-sm",
                              isBot && "bg-emerald-600 text-white rounded-tr-sm",
                              isAdmin && "bg-emerald-600 text-white rounded-tr-sm"
                            )}
                          >
                            {msg.content}
                          </div>
                          <p className={cn("text-xs text-slate-400", !isUser && "text-right")}>
                            {isBot && "AI · "}{isAdmin && "You · "}{formatTime(msg.created_at)}
                          </p>
                        </div>
                        {(isBot || isAdmin) && (
                          <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                            <AvatarFallback className={cn(
                              "text-white text-xs",
                              isBot ? "bg-emerald-500" : "bg-emerald-500"
                            )}>
                              {isBot ? <Bot className="w-3.5 h-3.5" /> : "Me"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Escalation banner */}
            {selected.status === "escalated" && (
              <div className="mx-4 mb-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">This conversation was escalated and needs human attention.</span>
                <button
                  onClick={() => updateStatus("resolved")}
                  className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve
                </button>
              </div>
            )}

            {/* Reply box */}
            <div className="bg-white border-t border-slate-200 p-4">
              <div className="flex gap-2 items-end max-w-3xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAdminReply();
                      }
                    }}
                    placeholder="Type a message to override or assist the AI..."
                    rows={1}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 max-h-32"
                    style={{ minHeight: "44px" }}
                  />
                </div>
                <Button
                  onClick={sendAdminReply}
                  disabled={!replyText.trim() || sending}
                  className="bg-emerald-600 hover:bg-emerald-700 h-11 w-11 p-0 rounded-xl flex-shrink-0"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 max-w-3xl mx-auto">
                Press Enter to send · Shift+Enter for new line · Messages sent here appear as admin messages to the visitor.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">Select a conversation</h3>
              <p className="text-sm text-slate-400">Choose a conversation from the list to view messages.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
