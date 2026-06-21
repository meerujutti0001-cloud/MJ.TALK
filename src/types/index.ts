export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

/* ─── Role system ─────────────────────────────────────── */
export type UserRole = "super_admin" | "owner" | "agent" | "guest";

/** Permissions keyed by role */
export const ROLE_PERMISSIONS: Record<UserRole, {
  canManageSettings: boolean;
  canManageTeam: boolean;
  canViewAllChats: boolean;
  canAssignChats: boolean;
  canViewAnalytics: boolean;
  canViewPurchaseRequests: boolean;
  canDeleteChatbot: boolean;
  canCreateChatbot: boolean;
  roleLabel: string;
  roleColor: string;
}> = {
  super_admin: {
    canManageSettings: true,
    canManageTeam: true,
    canViewAllChats: true,
    canAssignChats: true,
    canViewAnalytics: true,
    canViewPurchaseRequests: true,
    canDeleteChatbot: true,
    canCreateChatbot: true,
    roleLabel: "Super Admin",
    roleColor: "#f59e0b",
  },
  owner: {
    canManageSettings: true,
    canManageTeam: true,
    canViewAllChats: true,
    canAssignChats: true,
    canViewAnalytics: true,
    canViewPurchaseRequests: false,
    canDeleteChatbot: true,
    canCreateChatbot: true,
    roleLabel: "Owner",
    roleColor: "#0d8585",
  },
  agent: {
    canManageSettings: false,
    canManageTeam: false,
    canViewAllChats: true,
    canAssignChats: true,
    canViewAnalytics: false,
    canViewPurchaseRequests: false,
    canDeleteChatbot: false,
    canCreateChatbot: false,
    roleLabel: "Agent",
    roleColor: "#6366f1",
  },
  guest: {
    canManageSettings: false,
    canManageTeam: false,
    canViewAllChats: false,
    canAssignChats: false,
    canViewAnalytics: false,
    canViewPurchaseRequests: false,
    canDeleteChatbot: false,
    canCreateChatbot: false,
    roleLabel: "Guest",
    roleColor: "#94a3b8",
  },
};

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS["owner"]): boolean {
  return ROLE_PERMISSIONS[role][permission] as boolean;
}

/* ─── Existing types ──────────────────────────────────── */

export interface TeamMember {
  id: string;
  org_id: string;
  user_id: string | null;
  role: "owner" | "agent";
  email: string;
  invited_at: string;
  accepted_at: string | null;
}

export interface Chatbot {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  status: "active" | "inactive";
  widget_color: string;
  avatar_url: string | null;
  pre_chat_form_enabled: boolean;
  allowed_domains: string[] | null;
  escalation_keyword: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  chatbot_id: string;
  session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  page_url: string | null;
  browser_info: string | null;
  status: "open" | "escalated" | "resolved";
  message_count: number;
  // Phase 2 new fields (present after migration, optional for backwards compat)
  assigned_agent_id?: string | null;
  priority?: "low" | "medium" | "high" | null;
  source?: "widget" | "manual" | "ai_handoff" | "human_request" | null;
  last_message_at?: string | null;
  escalation_requested_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  chatbot?: Chatbot;
  messages?: Message[];
}

export interface ConversationNote {
  id: string;
  conversation_id: string;
  agent_id: string;
  note_text: string;
  created_at: string;
  agent?: { email: string; full_name: string | null };
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  created_at: string;
  is_seen?: boolean;
  delivery_status?: "pending" | "sent" | "delivered" | "failed";
}

export interface Notification {
  id: string;
  org_id: string;
  conversation_id: string;
  type: "escalated" | "flagged" | "idle" | "new_message" | "new_chat" | "assigned" | "mention";
  message: string;
  read: boolean;
  priority?: "low" | "normal" | "high" | "urgent" | null;
  created_at: string;
  // Joined
  conversation?: Conversation;
}

export interface KbArticle {
  id: string;
  chatbot_id: string;
  org_id: string;
  title: string;
  content: string;
  category: "general" | "account" | "payment" | "refund" | "technical" | "setup" | "faq";
  tags: string[];
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type IntentLabel =
  | "refund" | "technical" | "account" | "billing"
  | "complaint" | "setup" | "general" | "other";

export interface AiSession {
  id: string;
  conversation_id: string;
  detected_intent: string | null;
  intent_label: IntentLabel | null;
  intent_confidence: number | null;
  ai_confidence_score: number | null;
  escalated_to_human: boolean;
  escalation_reason: string | null;
  ai_summary: string | null;
  handoff_summary: string | null;
  kb_articles_used: string[];
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface ChatRequest {
  messages: ChatMessage[];
  chatbotId: string;
  conversationId: string;
  sessionId: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CreateConversationRequest {
  chatbotId: string;
  sessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  pageUrl?: string;
  browserInfo?: string;
}

export interface CreateMessageRequest {
  conversationId: string;
  role: "user" | "assistant" | "admin";
  content: string;
}

export interface AdminReplyRequest {
  conversationId: string;
  content: string;
}

// Dashboard stats
export interface DashboardStats {
  totalChatbots: number;
  totalConversations: number;
  openConversations: number;
  escalatedConversations: number;
  resolvedConversations: number;
  totalMessages: number;
  unreadNotifications: number;
}

export interface ChatbotStats {
  chatbotId: string;
  chatbotName: string;
  totalConversations: number;
  openConversations: number;
  escalatedConversations: number;
  resolvedConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
}

// Widget config (public, fetched without auth)
export interface WidgetConfig {
  id: string;
  name: string;
  widget_color: string;
  avatar_url: string | null;
  pre_chat_form_enabled: boolean;
  escalation_keyword: string;
  status: "active" | "inactive";
}

// Pre-chat form
export interface PreChatFormData {
  name: string;
  email: string;
}
