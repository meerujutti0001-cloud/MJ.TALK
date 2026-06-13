export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

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
  created_at: string;
  updated_at: string;
  // Joined
  chatbot?: Chatbot;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  org_id: string;
  conversation_id: string;
  type: "escalated" | "flagged" | "idle";
  message: string;
  read: boolean;
  created_at: string;
  // Joined
  conversation?: Conversation;
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
