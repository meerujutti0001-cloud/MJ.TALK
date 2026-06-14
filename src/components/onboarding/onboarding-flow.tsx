"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Ticket, BookOpen, Globe,
  ArrowRight, Check, Loader2, ChevronLeft,
  Bot, Palette, Zap, Shield, Plus, X,
  AlignLeft, Tag, Link as LinkIcon, Smile,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* ─── types ─── */
interface OnboardingFlowProps {
  orgId: string;
  orgName: string;
  userEmail: string;
}

type Product = "live_chat" | "ticketing" | "knowledge_base" | "pages";
type Step = "product" | "profile" | "chatbot" | "install" | "done";

const PRODUCTS = [
  {
    id: "live_chat" as Product,
    icon: MessageCircle,
    label: "Live Chat",
    desc: "Add live chat to your website",
    color: "#0d8585",
    bg: "#edfaf7",
    recommended: true,
  },
  {
    id: "ticketing" as Product,
    icon: Ticket,
    label: "AI Chatbot",
    desc: "Automate support with AI replies",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    id: "knowledge_base" as Product,
    icon: BookOpen,
    label: "Knowledge Base",
    desc: "Help customers help themselves",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    id: "pages" as Product,
    icon: Globe,
    label: "Widget Branding",
    desc: "Customize colors and appearance",
    color: "#f97316",
    bg: "#fff7ed",
  },
];

const WIDGET_COLORS = [
  "#0d8585", "#6366f1", "#3b82f6", "#8b5cf6",
  "#ec4899", "#f97316", "#22c55e", "#ef4444",
];

const BOT_TONES = ["Friendly", "Professional", "Concise", "Playful", "Empathetic"];

const BOT_PROMPTS: Record<Product, string> = {
  live_chat: `You are a friendly and professional customer support assistant. Your role is to:
- Greet visitors warmly and ask how you can help
- Answer questions about products, services, and policies clearly
- Help troubleshoot common issues step by step
- Escalate complex issues to a human agent by saying ESCALATE
Be concise, empathetic, and always stay on topic.`,
  ticketing: `You are an intelligent AI support agent. You specialize in:
- Understanding and categorizing customer issues
- Providing step-by-step troubleshooting guides
- Collecting information needed to resolve tickets efficiently
- Escalating unresolved issues by saying ESCALATE
Always confirm you understand the issue before suggesting solutions.`,
  knowledge_base: `You are a helpful knowledge base assistant. Your job is to:
- Answer FAQs clearly and concisely
- Guide users to the right documentation or resources
- Summarize complex topics in simple language
- Say ESCALATE if a question requires a human expert
Keep answers brief but complete.`,
  pages: `You are a personalized brand assistant. You represent the company and:
- Reflect the company's tone and brand voice
- Answer questions about the company's products and services
- Help visitors navigate to the right resource or team
- Say ESCALATE when a visitor needs direct human contact
Be friendly, on-brand, and solution-focused.`,
};

/* ─── step indicator ─── */
function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["product", "profile", "chatbot", "install"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {steps.map((s, i) => (
        <div
          key={s}
          className={cn(
            "rounded-full transition-all",
            i < idx ? "w-6 h-2 bg-teal-500" :
            i === idx ? "w-6 h-2 bg-teal-500" :
            "w-2 h-2 bg-white/20"
          )}
        />
      ))}
    </div>
  );
}

/* ─── shared input style ─── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.7rem 1rem",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, color: "#fff", fontSize: "0.9rem",
  outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.8rem", fontWeight: 600,
  color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem",
};
const sectionCard: React.CSSProperties = {
  padding: "1rem", background: "rgba(255,255,255,0.04)",
  borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
};

/* ══════════════════════════════════════════════
   STEP-3 VARIANTS
══════════════════════════════════════════════ */

/* ── Live Chat ── widget look + pre-chat form */
function Step3LiveChat({
  botName, setBotName,
  botColor, setBotColor, customColor, setCustomColor,
  preChatForm, setPreChatForm,
}: {
  botName: string; setBotName: (v: string) => void;
  botColor: string; setBotColor: (v: string) => void;
  customColor: string; setCustomColor: (v: string) => void;
  preChatForm: boolean; setPreChatForm: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Bot name */}
      <div>
        <label style={labelStyle}><Bot size={14} style={{ display: "inline", marginRight: 4 }} />Chat Widget Name</label>
        <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
          placeholder="Support Chat"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#0d8585"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
          This name appears in the chat header your visitors see.
        </p>
      </div>

      {/* Widget color */}
      <div>
        <label style={labelStyle}><Palette size={14} style={{ display: "inline", marginRight: 4 }} />Widget Color</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
          {WIDGET_COLORS.map(c => (
            <button key={c} onClick={() => { setBotColor(c); setCustomColor(c); }}
              style={{ width: 34, height: 34, borderRadius: 8, background: c, border: botColor === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", transition: "transform 0.1s", transform: botColor === c ? "scale(1.15)" : "scale(1)" }}
            />
          ))}
          <input type="color" value={customColor}
            onChange={e => { setCustomColor(e.target.value); setBotColor(e.target.value); }}
            style={{ width: 34, height: 34, borderRadius: 8, border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 2, background: "transparent" }}
            title="Custom color"
          />
        </div>
      </div>

      {/* Pre-chat form toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", ...sectionCard }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Zap size={15} color="#f97316" /> Collect visitor info before chat
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginTop: 2 }}>Ask for name & email before the conversation starts</p>
        </div>
        <button onClick={() => setPreChatForm(!preChatForm)}
          style={{ width: 44, height: 24, borderRadius: 12, background: preChatForm ? "#0d8585" : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
        >
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: preChatForm ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </button>
      </div>

      {/* Preview */}
      <div style={{ ...sectionCard, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Shield size={12} /> Preview
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${botColor},${botColor}cc)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
            <MessageCircle size={22} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{botName || "Support Chat"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Online · replies instantly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── AI Chatbot ── persona, tone, custom prompt */
function Step3AIChatbot({
  botName, setBotName,
  customPrompt, setCustomPrompt,
  selectedTone, setSelectedTone,
  escalationKeyword, setEscalationKeyword,
}: {
  botName: string; setBotName: (v: string) => void;
  customPrompt: string; setCustomPrompt: (v: string) => void;
  selectedTone: string; setSelectedTone: (v: string) => void;
  escalationKeyword: string; setEscalationKeyword: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Bot name */}
      <div>
        <label style={labelStyle}><Bot size={14} style={{ display: "inline", marginRight: 4 }} />Bot Name</label>
        <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
          placeholder="Aria"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#8b5cf6"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
      </div>

      {/* Tone selector */}
      <div>
        <label style={labelStyle}><Smile size={14} style={{ display: "inline", marginRight: 4 }} />Personality Tone</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {BOT_TONES.map(tone => (
            <button key={tone} onClick={() => setSelectedTone(tone)}
              style={{
                padding: "0.45rem 1rem", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: selectedTone === tone ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                border: selectedTone === tone ? "1.5px solid #8b5cf6" : "1.5px solid rgba(255,255,255,0.1)",
                color: selectedTone === tone ? "#c4b5fd" : "rgba(255,255,255,0.55)",
              }}
            >{tone}</button>
          ))}
        </div>
      </div>

      {/* Custom system prompt */}
      <div>
        <label style={labelStyle}><AlignLeft size={14} style={{ display: "inline", marginRight: 4 }} />System Prompt</label>
        <textarea
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          rows={5}
          placeholder="You are a helpful support agent for [your company]. Answer questions about..."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
          onFocus={e => e.target.style.borderColor = "#8b5cf6"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
          Describe what your bot knows, its role, and how it should behave.
        </p>
      </div>

      {/* Escalation keyword */}
      <div style={sectionCard}>
        <label style={{ ...labelStyle, marginBottom: "0.6rem" }}>
          <Zap size={14} style={{ display: "inline", marginRight: 4 }} />Escalation Trigger Word
        </label>
        <input type="text" value={escalationKeyword} onChange={e => setEscalationKeyword(e.target.value)}
          placeholder="ESCALATE"
          style={{ ...inputStyle, width: "50%" }}
          onFocus={e => e.target.style.borderColor = "#8b5cf6"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
          When the bot outputs this word, the conversation is handed off to a human agent.
        </p>
      </div>
    </div>
  );
}

/* ── Knowledge Base ── FAQ topics + source URLs */
function Step3KnowledgeBase({
  botName, setBotName,
  faqTopics, setFaqTopics,
  sourceUrls, setSourceUrls,
  newTopic, setNewTopic,
  newUrl, setNewUrl,
}: {
  botName: string; setBotName: (v: string) => void;
  faqTopics: string[]; setFaqTopics: (v: string[]) => void;
  sourceUrls: string[]; setSourceUrls: (v: string[]) => void;
  newTopic: string; setNewTopic: (v: string) => void;
  newUrl: string; setNewUrl: (v: string) => void;
}) {
  const addTopic = () => {
    const t = newTopic.trim();
    if (t && !faqTopics.includes(t)) { setFaqTopics([...faqTopics, t]); setNewTopic(""); }
  };
  const removeTopic = (t: string) => setFaqTopics(faqTopics.filter(x => x !== t));

  const addUrl = () => {
    const u = newUrl.trim();
    if (u && !sourceUrls.includes(u)) { setSourceUrls([...sourceUrls, u]); setNewUrl(""); }
  };
  const removeUrl = (u: string) => setSourceUrls(sourceUrls.filter(x => x !== u));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Bot name */}
      <div>
        <label style={labelStyle}><Bot size={14} style={{ display: "inline", marginRight: 4 }} />Assistant Name</label>
        <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
          placeholder="Help Center Bot"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#3b82f6"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
      </div>

      {/* FAQ Topics */}
      <div>
        <label style={labelStyle}><Tag size={14} style={{ display: "inline", marginRight: 4 }} />FAQ Topics</label>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.6rem" }}>
          Add the main topics your knowledge base covers.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <input type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTopic()}
            placeholder="e.g. Billing, Shipping, Returns"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
          />
          <button onClick={addTopic}
            style={{ padding: "0 1rem", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 8, color: "#93c5fd", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Plus size={16} />
          </button>
        </div>
        {faqTopics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {faqTopics.map(t => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.65rem", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)", borderRadius: 999, fontSize: "0.78rem", color: "#93c5fd" }}>
                {t}
                <button onClick={() => removeTopic(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", display: "flex", padding: 0, lineHeight: 1 }}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Source URLs */}
      <div>
        <label style={labelStyle}><LinkIcon size={14} style={{ display: "inline", marginRight: 4 }} />Source URLs (optional)</label>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.6rem" }}>
          Link your docs or help pages — the bot will reference these.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addUrl()}
            placeholder="https://docs.yoursite.com"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
          />
          <button onClick={addUrl}
            style={{ padding: "0 1rem", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 8, color: "#93c5fd", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Plus size={16} />
          </button>
        </div>
        {sourceUrls.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {sourceUrls.map(u => (
              <div key={u} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}>
                <LinkIcon size={12} style={{ color: "#93c5fd", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u}</span>
                <button onClick={() => removeUrl(u)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 0 }}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Widget Branding ── colors, avatar, position */
const WIDGET_POSITIONS = ["Bottom Right", "Bottom Left", "Top Right", "Top Left"];
const AVATAR_EMOJIS = ["🤖", "💬", "⚡", "✨", "🎯", "🛟", "💡", "🌟"];

function Step3WidgetBranding({
  botName, setBotName,
  botColor, setBotColor, customColor, setCustomColor,
  avatarEmoji, setAvatarEmoji,
  widgetPosition, setWidgetPosition,
  greeting, setGreeting,
}: {
  botName: string; setBotName: (v: string) => void;
  botColor: string; setBotColor: (v: string) => void;
  customColor: string; setCustomColor: (v: string) => void;
  avatarEmoji: string; setAvatarEmoji: (v: string) => void;
  widgetPosition: string; setWidgetPosition: (v: string) => void;
  greeting: string; setGreeting: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Bot name */}
      <div>
        <label style={labelStyle}><Bot size={14} style={{ display: "inline", marginRight: 4 }} />Widget Title</label>
        <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
          placeholder="Chat with us"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#f97316"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
      </div>

      {/* Greeting message */}
      <div>
        <label style={labelStyle}><MessageCircle size={14} style={{ display: "inline", marginRight: 4 }} />Opening Greeting</label>
        <input type="text" value={greeting} onChange={e => setGreeting(e.target.value)}
          placeholder="Hi there 👋 How can we help?"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "#f97316"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
        />
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: 4 }}>First message visitors see when they open the widget.</p>
      </div>

      {/* Brand color */}
      <div>
        <label style={labelStyle}><Palette size={14} style={{ display: "inline", marginRight: 4 }} />Brand Color</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
          {WIDGET_COLORS.map(c => (
            <button key={c} onClick={() => { setBotColor(c); setCustomColor(c); }}
              style={{ width: 34, height: 34, borderRadius: 8, background: c, border: botColor === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", transition: "transform 0.1s", transform: botColor === c ? "scale(1.15)" : "scale(1)" }}
            />
          ))}
          <input type="color" value={customColor}
            onChange={e => { setCustomColor(e.target.value); setBotColor(e.target.value); }}
            style={{ width: 34, height: 34, borderRadius: 8, border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 2, background: "transparent" }}
            title="Custom color"
          />
        </div>
      </div>

      {/* Avatar emoji */}
      <div>
        <label style={labelStyle}><Smile size={14} style={{ display: "inline", marginRight: 4 }} />Widget Avatar</label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {AVATAR_EMOJIS.map(em => (
            <button key={em} onClick={() => setAvatarEmoji(em)}
              style={{
                width: 40, height: 40, borderRadius: 10, fontSize: "1.3rem", cursor: "pointer",
                background: avatarEmoji === em ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)",
                border: avatarEmoji === em ? "2px solid #f97316" : "2px solid rgba(255,255,255,0.1)",
                transition: "all 0.15s",
              }}
            >{em}</button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div>
        <label style={labelStyle}>Widget Position</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {WIDGET_POSITIONS.map(pos => (
            <button key={pos} onClick={() => setWidgetPosition(pos)}
              style={{
                padding: "0.6rem 0.75rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: widgetPosition === pos ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
                border: widgetPosition === pos ? "1.5px solid #f97316" : "1.5px solid rgba(255,255,255,0.1)",
                color: widgetPosition === pos ? "#fdba74" : "rgba(255,255,255,0.5)",
              }}
            >{pos}</button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div style={{ ...sectionCard, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Shield size={12} /> Preview
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg,${botColor},${botColor}cc)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", flexShrink: 0 }}>
            {avatarEmoji}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{botName || "Chat with us"}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", marginTop: 2 }}>{greeting || "Hi there 👋 How can we help?"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export function OnboardingFlow({ orgId, orgName }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("product");
  const [product, setProduct] = useState<Product>("live_chat");

  /* Profile step */
  const [fullName, setFullName] = useState("");
  const [website, setWebsite] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [industry, setIndustry] = useState("");

  /* Shared chatbot fields */
  const [botName, setBotName] = useState(orgName + " Support");
  const [botColor, setBotColor] = useState("#0d8585");
  const [customColor, setCustomColor] = useState("#0d8585");

  /* Live Chat specific */
  const [preChatForm, setPreChatForm] = useState(false);

  /* AI Chatbot specific */
  const [customPrompt, setCustomPrompt] = useState(BOT_PROMPTS.ticketing);
  const [selectedTone, setSelectedTone] = useState("Friendly");
  const [escalationKeyword, setEscalationKeyword] = useState("ESCALATE");

  /* Knowledge Base specific */
  const [faqTopics, setFaqTopics] = useState<string[]>([]);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newUrl, setNewUrl] = useState("");

  /* Widget Branding specific */
  const [avatarEmoji, setAvatarEmoji] = useState("🤖");
  const [widgetPosition, setWidgetPosition] = useState("Bottom Right");
  const [greeting, setGreeting] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);

  /* ── step 3 heading/subtitle per product ── */
  const step3Meta: Record<Product, { title: string; subtitle: string }> = {
    live_chat: {
      title: "Customize your chat widget",
      subtitle: "Choose how your live chat looks and what information to collect from visitors.",
    },
    ticketing: {
      title: "Configure your AI chatbot",
      subtitle: "Define your bot's personality, tone, and the instructions it follows.",
    },
    knowledge_base: {
      title: "Set up your knowledge base bot",
      subtitle: "Tell us what topics you cover and link your existing docs.",
    },
    pages: {
      title: "Brand your widget",
      subtitle: "Customize every visual detail so the widget feels like part of your site.",
    },
  };

  /* ── build system prompt at submit time ── */
  const buildPrompt = (): string => {
    if (product === "ticketing") {
      const toneNote = `Tone: ${selectedTone}.`;
      return `${toneNote}\n\n${customPrompt}`;
    }
    if (product === "knowledge_base") {
      const topicsNote = faqTopics.length ? `Topics you cover: ${faqTopics.join(", ")}.` : "";
      const urlsNote = sourceUrls.length ? `Reference these docs: ${sourceUrls.join(", ")}.` : "";
      return `${BOT_PROMPTS.knowledge_base}\n\n${topicsNote}\n${urlsNote}`.trim();
    }
    if (product === "pages") {
      const greetingNote = greeting ? `Opening greeting: "${greeting}".` : "";
      return `${BOT_PROMPTS.pages}\n\n${greetingNote}`.trim();
    }
    return BOT_PROMPTS.live_chat;
  };

  /* ── create chatbot & finish ── */
  const finish = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      let hostname: string | null = null;
      if (website) {
        try {
          hostname = new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
        } catch { /* ignore bad URLs */ }
      }

      const { data, error: err } = await supabase
        .from("chatbots")
        .insert({
          org_id: orgId,
          name: botName.trim() || orgName + " Support",
          description: `AI support bot for ${orgName}`,
          system_prompt: buildPrompt(),
          status: "active",
          widget_color: botColor,
          pre_chat_form_enabled: preChatForm,
          escalation_keyword: product === "ticketing" ? escalationKeyword : "ESCALATE",
          allowed_domains: hostname ? [hostname] : null,
        })
        .select("id")
        .single();

      if (err || !data) throw new Error(err?.message ?? "Failed to create chatbot");
      setCreatedBotId(data.id);
      setStep("install");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";
  const embedCode = createdBotId ? `<!-- ${botName} — AI Support Widget -->
<script>
  window.SupportAIConfig = {
    chatbotId: "${createdBotId}",
    apiUrl: "${appUrl}"
  };
</script>
<script src="${appUrl}/widget.js" defer></script>` : "";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#09090b 0%,#0f172a 60%,#0c1a30 100%)",
      fontFamily: "'Inter',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", position: "relative",
    }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 50% at 50% 0%,rgba(13,133,133,0.12) 0%,transparent 70%)" }} />

      {/* Logo */}
      <div style={{ position: "fixed", top: "1.5rem", left: "1.5rem", fontWeight: 800, fontSize: "1.2rem", color: "#fff", letterSpacing: "-0.03em" }}>
        MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
      </div>

      {/* Skip */}
      {step !== "install" && (
        <button onClick={() => router.push("/dashboard")}
          style={{ position: "fixed", top: "1.25rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
          Skip setup →
        </button>
      )}

      <div style={{ width: "100%", maxWidth: "600px", position: "relative" }}>
        <StepDots step={step} />

        {/* ══════ STEP 1 — PRODUCT ══════ */}
        {step === "product" && (
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
              Which product would you like to set up first?
            </h1>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "2.5rem" }}>
              You can add more products later from your dashboard.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
              {PRODUCTS.map((p) => {
                const Icon = p.icon;
                const selected = product === p.id;
                return (
                  <button key={p.id} onClick={() => { setProduct(p.id); setStep(p.id === "live_chat" ? "profile" : "chatbot"); }}
                    style={{
                      background: selected ? "rgba(13,133,133,0.15)" : "rgba(255,255,255,0.04)",
                      border: selected ? "1.5px solid #0d8585" : "1.5px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px", padding: "1.25rem 1.5rem", cursor: "pointer",
                      display: "flex", alignItems: "flex-start", gap: "1rem",
                      textAlign: "left", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}}
                    onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={20} color={p.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{p.label}</span>
                        {p.recommended && (
                          <span style={{ background: "rgba(13,133,133,0.3)", color: "#1dbfa0", fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px", borderRadius: 999, border: "1px solid rgba(29,191,160,0.3)" }}>POPULAR</span>
                        )}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginTop: "0.2rem" }}>{p.desc}</p>
                    </div>
                    <ArrowRight size={15} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>

            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.25)", marginTop: "0.5rem" }}>
              Click any product to get started
            </p>
          </div>
        )}

        {/* ══════ STEP 2 — PROFILE ══════ */}
        {step === "profile" && (
          <div>
            <button onClick={() => setStep("product")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h1 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
              Tell us about yourself
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", marginBottom: "2rem" }}>
              Help us personalize your experience. All fields are optional.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Your Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#0d8585"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
              </div>
              <div>
                <label style={labelStyle}>Your Website URL</label>
                <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#0d8585"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Team Size</label>
                  <select value={teamSize} onChange={e => setTeamSize(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="1" style={{ background: "#1a1a2e" }}>Just me</option>
                    <option value="2-5" style={{ background: "#1a1a2e" }}>2–5 people</option>
                    <option value="6-20" style={{ background: "#1a1a2e" }}>6–20 people</option>
                    <option value="21-100" style={{ background: "#1a1a2e" }}>21–100 people</option>
                    <option value="100+" style={{ background: "#1a1a2e" }}>100+ people</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="" style={{ background: "#1a1a2e" }}>Select industry</option>
                    {["E-commerce", "SaaS / Software", "Healthcare", "Education", "Finance", "Agency", "Real Estate", "Other"].map(i => (
                      <option key={i} value={i} style={{ background: "#1a1a2e" }}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button onClick={() => setStep("chatbot")}
              style={{ width: "100%", padding: "0.9rem", marginTop: "2rem", background: "linear-gradient(135deg,#0d8585,#14a085)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Continue <ArrowRight size={18} />
            </button>
            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}>This info is only used to set up your account</p>
          </div>
        )}

        {/* ══════ STEP 3 — PER-PRODUCT SETUP ══════ */}
        {step === "chatbot" && (
          <div>
            <button onClick={() => setStep(product === "live_chat" ? "profile" : "product")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h1 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
              {step3Meta[product].title}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", marginBottom: "2rem" }}>
              {step3Meta[product].subtitle}
            </p>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            {product === "live_chat" && (
              <Step3LiveChat
                botName={botName} setBotName={setBotName}
                botColor={botColor} setBotColor={setBotColor}
                customColor={customColor} setCustomColor={setCustomColor}
                preChatForm={preChatForm} setPreChatForm={setPreChatForm}
              />
            )}
            {product === "ticketing" && (
              <Step3AIChatbot
                botName={botName} setBotName={setBotName}
                customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
                selectedTone={selectedTone} setSelectedTone={setSelectedTone}
                escalationKeyword={escalationKeyword} setEscalationKeyword={setEscalationKeyword}
              />
            )}
            {product === "knowledge_base" && (
              <Step3KnowledgeBase
                botName={botName} setBotName={setBotName}
                faqTopics={faqTopics} setFaqTopics={setFaqTopics}
                sourceUrls={sourceUrls} setSourceUrls={setSourceUrls}
                newTopic={newTopic} setNewTopic={setNewTopic}
                newUrl={newUrl} setNewUrl={setNewUrl}
              />
            )}
            {product === "pages" && (
              <Step3WidgetBranding
                botName={botName} setBotName={setBotName}
                botColor={botColor} setBotColor={setBotColor}
                customColor={customColor} setCustomColor={setCustomColor}
                avatarEmoji={avatarEmoji} setAvatarEmoji={setAvatarEmoji}
                widgetPosition={widgetPosition} setWidgetPosition={setWidgetPosition}
                greeting={greeting} setGreeting={setGreeting}
              />
            )}

            <button onClick={finish} disabled={loading}
              style={{ width: "100%", padding: "0.9rem", marginTop: "2rem", background: loading ? "rgba(13,133,133,0.5)" : "linear-gradient(135deg,#0d8585,#14a085)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {loading
                ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Creating your bot...</>
                : <>Launch my chatbot <ArrowRight size={18} /></>}
            </button>
          </div>
        )}

        {/* ══════ STEP 4 — INSTALL ══════ */}
        {step === "install" && createdBotId && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(13,133,133,0.15)", border: "2px solid #0d8585", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Check size={28} color="#0d8585" />
              </div>
              <h1 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
                Your chatbot is live! 🎉
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem" }}>
                Add this snippet to your website to start chatting.
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>Installation snippet</p>
              <pre style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1rem", fontSize: "0.78rem", color: "#7dd3fc", overflowX: "auto", margin: 0, lineHeight: 1.7, fontFamily: "'Fira Code','Consolas',monospace" }}>
                {embedCode}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(embedCode).then(() => alert("Copied!"))}
                style={{ marginTop: "0.75rem", padding: "0.55rem 1.25rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              >
                Copy snippet
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
              {[
                "Copy the snippet above",
                "Paste it just before the </body> tag on every page of your website",
                "The chat button will appear automatically in the bottom-right corner",
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(13,133,133,0.2)", border: "1px solid #0d8585", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.72rem", fontWeight: 700, color: "#1dbfa0" }}>{i + 1}</div>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => router.push(`/dashboard/chatbots/${createdBotId}/embed`)}
                style={{ flex: 1, padding: "0.9rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              >
                View embed options
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ flex: 1, padding: "0.9rem", background: "linear-gradient(135deg,#0d8585,#14a085)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                Go to dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1a2e; color: #fff; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  );
}
