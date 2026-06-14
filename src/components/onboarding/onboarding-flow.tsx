"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Ticket, BookOpen, Globe,
  ArrowRight, Check, Loader2, ChevronLeft,
  Bot, Palette, Zap, Shield,
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

/* ─── main component ─── */
export function OnboardingFlow({ orgId, orgName, userEmail }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("product");
  const [product, setProduct] = useState<Product>("live_chat");

  // Profile step
  const [fullName, setFullName] = useState("");
  const [website, setWebsite] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [industry, setIndustry] = useState("");

  // Chatbot step
  const [botName, setBotName] = useState(orgName + " Support");
  const [botColor, setBotColor] = useState("#0d8585");
  const [customColor, setCustomColor] = useState("#0d8585");
  const [preChatForm, setPreChatForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);

  /* ── create chatbot & finish ── */
  const finish = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("chatbots")
        .insert({
          org_id: orgId,
          name: botName.trim() || orgName + " Support",
          description: `AI support bot for ${orgName}`,
          system_prompt: BOT_PROMPTS[product],
          status: "active",
          widget_color: botColor,
          pre_chat_form_enabled: preChatForm,
          escalation_keyword: "ESCALATE",
          allowed_domains: website ? [new URL(website.startsWith("http") ? website : `https://${website}`).hostname] : null,
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#09090b 0%,#0f172a 60%,#0c1a30 100%)",
        fontFamily: "'Inter',sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
      }}
    >
      {/* Ambient glow */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse 50% 50% at 50% 0%,rgba(13,133,133,0.12) 0%,transparent 70%)" }} />

      {/* Logo */}
      <div style={{ position:"fixed",top:"1.5rem",left:"1.5rem",fontWeight:800,fontSize:"1.2rem",color:"#fff",letterSpacing:"-0.03em" }}>
        MJ<span style={{ color:"#1dbfa0" }}>.</span>TALK
      </div>

      {/* Skip */}
      {step !== "install" && (
        <button
          onClick={() => router.push("/dashboard")}
          style={{ position:"fixed",top:"1.25rem",right:"1.5rem",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:"0.8rem" }}
        >
          Skip setup →
        </button>
      )}

      <div style={{ width:"100%",maxWidth:"600px",position:"relative" }}>
        <StepDots step={step} />

        {/* ══════ STEP 1 — PRODUCT ══════ */}
        {step === "product" && (
          <div>
            <h1 style={{ fontSize:"clamp(1.5rem,3vw,2rem)",fontWeight:800,color:"#fff",textAlign:"center",marginBottom:"0.5rem",letterSpacing:"-0.03em" }}>
              Which product would you like to set up first?
            </h1>
            <p style={{ textAlign:"center",color:"rgba(255,255,255,0.45)",fontSize:"0.9rem",marginBottom:"2.5rem" }}>
              You can add more products later from your dashboard.
            </p>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"2rem" }}>
              {PRODUCTS.map((p) => {
                const Icon = p.icon;
                const selected = product === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProduct(p.id)}
                    style={{
                      background: selected ? "rgba(13,133,133,0.15)" : "rgba(255,255,255,0.04)",
                      border: selected ? "1.5px solid #0d8585" : "1.5px solid rgba(255,255,255,0.1)",
                      borderRadius:"14px",padding:"1.25rem 1.5rem",cursor:"pointer",
                      display:"flex",alignItems:"flex-start",gap:"1rem",
                      textAlign:"left",transition:"all 0.15s",
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor="rgba(255,255,255,0.25)"; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}
                  >
                    <div style={{ width:40,height:40,borderRadius:10,background:p.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <Icon size={20} color={p.color} />
                    </div>
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:"0.5rem" }}>
                        <span style={{ color:"#fff",fontWeight:700,fontSize:"0.95rem" }}>{p.label}</span>
                        {p.recommended && (
                          <span style={{ background:"rgba(13,133,133,0.3)",color:"#1dbfa0",fontSize:"0.65rem",fontWeight:700,padding:"1px 6px",borderRadius:999,border:"1px solid rgba(29,191,160,0.3)" }}>
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p style={{ color:"rgba(255,255,255,0.45)",fontSize:"0.8rem",marginTop:"0.2rem" }}>{p.desc}</p>
                    </div>
                    {selected && (
                      <div style={{ marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:"#0d8585",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep("profile")}
              style={{ width:"100%",padding:"0.9rem",background:"linear-gradient(135deg,#0d8585,#14a085)",border:"none",borderRadius:"10px",color:"#fff",fontWeight:700,fontSize:"1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",transition:"opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity="0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity="1"}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ══════ STEP 2 — PROFILE ══════ */}
        {step === "profile" && (
          <div>
            <button onClick={() => setStep("product")} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"1.5rem",fontSize:"0.85rem" }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h1 style={{ fontSize:"clamp(1.4rem,3vw,1.9rem)",fontWeight:800,color:"#fff",marginBottom:"0.5rem",letterSpacing:"-0.03em" }}>
              Tell us about yourself
            </h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:"0.875rem",marginBottom:"2rem" }}>
              Help us personalize your experience. All fields are optional.
            </p>

            <div style={{ display:"flex",flexDirection:"column",gap:"1rem" }}>
              {/* Full name */}
              <div>
                <label style={{ display:"block",fontSize:"0.8rem",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"0.4rem" }}>Your Full Name</label>
                <input
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  style={{ width:"100%",padding:"0.7rem 1rem",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",fontSize:"0.9rem",outline:"none",boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor="#0d8585"}
                  onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.12)"}
                />
              </div>

              {/* Website */}
              <div>
                <label style={{ display:"block",fontSize:"0.8rem",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"0.4rem" }}>Your Website URL</label>
                <input
                  type="text" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                  style={{ width:"100%",padding:"0.7rem 1rem",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",fontSize:"0.9rem",outline:"none",boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor="#0d8585"}
                  onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.12)"}
                />
              </div>

              {/* Team size + industry row */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
                <div>
                  <label style={{ display:"block",fontSize:"0.8rem",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"0.4rem" }}>Team Size</label>
                  <select
                    value={teamSize} onChange={e => setTeamSize(e.target.value)}
                    style={{ width:"100%",padding:"0.7rem 1rem",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",fontSize:"0.9rem",outline:"none",cursor:"pointer" }}
                  >
                    <option value="1" style={{ background:"#1a1a2e" }}>Just me</option>
                    <option value="2-5" style={{ background:"#1a1a2e" }}>2–5 people</option>
                    <option value="6-20" style={{ background:"#1a1a2e" }}>6–20 people</option>
                    <option value="21-100" style={{ background:"#1a1a2e" }}>21–100 people</option>
                    <option value="100+" style={{ background:"#1a1a2e" }}>100+ people</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:"block",fontSize:"0.8rem",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"0.4rem" }}>Industry</label>
                  <select
                    value={industry} onChange={e => setIndustry(e.target.value)}
                    style={{ width:"100%",padding:"0.7rem 1rem",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",fontSize:"0.9rem",outline:"none",cursor:"pointer" }}
                  >
                    <option value="" style={{ background:"#1a1a2e" }}>Select industry</option>
                    {["E-commerce","SaaS / Software","Healthcare","Education","Finance","Agency","Real Estate","Other"].map(i => (
                      <option key={i} value={i} style={{ background:"#1a1a2e" }}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("chatbot")}
              style={{ width:"100%",padding:"0.9rem",marginTop:"2rem",background:"linear-gradient(135deg,#0d8585,#14a085)",border:"none",borderRadius:"10px",color:"#fff",fontWeight:700,fontSize:"1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",transition:"opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity="0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity="1"}
            >
              Continue <ArrowRight size={18} />
            </button>

            <p style={{ textAlign:"center",marginTop:"1rem",fontSize:"0.8rem",color:"rgba(255,255,255,0.25)" }}>
              This info is only used to set up your account
            </p>
          </div>
        )}

        {/* ══════ STEP 3 — CHATBOT SETUP ══════ */}
        {step === "chatbot" && (
          <div>
            <button onClick={() => setStep("profile")} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"1.5rem",fontSize:"0.85rem" }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h1 style={{ fontSize:"clamp(1.4rem,3vw,1.9rem)",fontWeight:800,color:"#fff",marginBottom:"0.5rem",letterSpacing:"-0.03em" }}>
              Set up your AI assistant
            </h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:"0.875rem",marginBottom:"2rem" }}>
              Customize how your chatbot looks and feels.
            </p>

            {error && (
              <div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",padding:"0.75rem 1rem",borderRadius:8,marginBottom:"1.25rem",fontSize:"0.85rem" }}>
                {error}
              </div>
            )}

            <div style={{ display:"flex",flexDirection:"column",gap:"1.25rem" }}>
              {/* Bot name */}
              <div>
                <label style={{ display:"block",fontSize:"0.8rem",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"0.4rem" }}>
                  <Bot size={14} style={{ display:"inline",marginRight:4 }} />
                  Chatbot Name
                </label>
                <input
                  type="text" value={botName} onChange={e => setBotName(e.target.value)}
                  placeholder="Support Bot"
                  style={{ width:"100%",padding:"0.7rem 1rem",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",fontSize:"0.9rem",outline:"none",boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor="#0d8585"}
                  onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.12)"}
                />
              </div>

              {/* Widget color */}
              <div>
                <label style={{ display:"block",fontSize:"0.8rem",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"0.75rem" }}>
                  <Palette size={14} style={{ display:"inline",marginRight:4 }} />
                  Widget Color
                </label>
                <div style={{ display:"flex",flexWrap:"wrap",gap:"0.6rem",alignItems:"center" }}>
                  {WIDGET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => { setBotColor(c); setCustomColor(c); }}
                      style={{ width:34,height:34,borderRadius:8,background:c,border:botColor===c?"3px solid #fff":"3px solid transparent",cursor:"pointer",transition:"transform 0.1s",transform:botColor===c?"scale(1.15)":"scale(1)" }}
                    />
                  ))}
                  <input
                    type="color" value={customColor}
                    onChange={e => { setCustomColor(e.target.value); setBotColor(e.target.value); }}
                    style={{ width:34,height:34,borderRadius:8,border:"2px solid rgba(255,255,255,0.2)",cursor:"pointer",padding:2,background:"transparent" }}
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Pre-chat form toggle */}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <div style={{ color:"#fff",fontWeight:600,fontSize:"0.9rem",display:"flex",alignItems:"center",gap:"0.5rem" }}>
                    <Zap size={15} color="#f97316" /> Collect visitor info before chat
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.4)",fontSize:"0.8rem",marginTop:2 }}>Ask for name & email before the conversation starts</p>
                </div>
                <button
                  onClick={() => setPreChatForm(v => !v)}
                  style={{ width:44,height:24,borderRadius:12,background:preChatForm?"#0d8585":"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}
                >
                  <div style={{ width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:preChatForm?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }} />
                </button>
              </div>

              {/* Preview */}
              <div style={{ padding:"1rem",background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize:"0.75rem",color:"rgba(255,255,255,0.3)",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.4rem" }}>
                  <Shield size={12} /> Preview
                </p>
                <div style={{ display:"flex",alignItems:"center",gap:"0.75rem" }}>
                  <div style={{ width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${botColor},${botColor}cc)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.3)" }}>
                    <MessageCircle size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ color:"#fff",fontWeight:700,fontSize:"0.9rem" }}>{botName || "Support Bot"}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:"0.4rem",marginTop:2 }}>
                      <div style={{ width:7,height:7,borderRadius:"50%",background:"#22c55e" }} />
                      <span style={{ fontSize:"0.72rem",color:"rgba(255,255,255,0.5)" }}>Online · replies instantly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={finish}
              disabled={loading}
              style={{ width:"100%",padding:"0.9rem",marginTop:"2rem",background:loading?"rgba(13,133,133,0.5)":"linear-gradient(135deg,#0d8585,#14a085)",border:"none",borderRadius:"10px",color:"#fff",fontWeight:700,fontSize:"1rem",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",transition:"opacity 0.15s" }}
            >
              {loading ? <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} /> Creating your bot...</> : <>Launch my chatbot <ArrowRight size={18} /></>}
            </button>
          </div>
        )}

        {/* ══════ STEP 4 — INSTALL ══════ */}
        {step === "install" && createdBotId && (
          <div>
            <div style={{ textAlign:"center",marginBottom:"2rem" }}>
              <div style={{ width:64,height:64,borderRadius:"50%",background:"rgba(13,133,133,0.15)",border:"2px solid #0d8585",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem" }}>
                <Check size={28} color="#0d8585" />
              </div>
              <h1 style={{ fontSize:"clamp(1.4rem,3vw,1.9rem)",fontWeight:800,color:"#fff",marginBottom:"0.5rem",letterSpacing:"-0.03em" }}>
                Your chatbot is live! 🎉
              </h1>
              <p style={{ color:"rgba(255,255,255,0.45)",fontSize:"0.875rem" }}>
                Add this snippet to your website to start chatting.
              </p>
            </div>

            {/* Install steps */}
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"1.5rem",marginBottom:"1.5rem" }}>
              <p style={{ fontSize:"0.8rem",fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"1rem" }}>
                Installation snippet
              </p>
              <pre style={{ background:"#0d1117",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"1rem",fontSize:"0.78rem",color:"#7dd3fc",overflowX:"auto",margin:0,lineHeight:1.7,fontFamily:"'Fira Code','Consolas',monospace" }}>
                {embedCode}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(embedCode).then(() => alert("Copied!"))}
                style={{ marginTop:"0.75rem",padding:"0.55rem 1.25rem",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",fontSize:"0.82rem",fontWeight:600,cursor:"pointer",transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
              >
                Copy snippet
              </button>
            </div>

            {/* Steps */}
            <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"2rem" }}>
              {[
                "Copy the snippet above",
                "Paste it just before the </body> tag on every page of your website",
                "The chat button will appear automatically in the bottom-right corner",
              ].map((text, i) => (
                <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:"0.75rem" }}>
                  <div style={{ width:24,height:24,borderRadius:"50%",background:"rgba(13,133,133,0.2)",border:"1px solid #0d8585",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.72rem",fontWeight:700,color:"#1dbfa0" }}>{i+1}</div>
                  <p style={{ color:"rgba(255,255,255,0.65)",fontSize:"0.875rem",lineHeight:1.5,margin:0 }}>{text}</p>
                </div>
              ))}
            </div>

            <div style={{ display:"flex",gap:"1rem" }}>
              <button
                onClick={() => router.push(`/dashboard/chatbots/${createdBotId}/embed`)}
                style={{ flex:1,padding:"0.9rem",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",color:"#fff",fontWeight:600,fontSize:"0.9rem",cursor:"pointer",transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}
              >
                View embed options
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ flex:1,padding:"0.9rem",background:"linear-gradient(135deg,#0d8585,#14a085)",border:"none",borderRadius:"10px",color:"#fff",fontWeight:700,fontSize:"0.9rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}
              >
                Go to dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        select option { background:#1a1a2e; color:#fff; }
        input::placeholder,textarea::placeholder { color:rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  );
}
