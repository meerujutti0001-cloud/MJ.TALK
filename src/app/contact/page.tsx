"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Send, CheckCircle2, Mail, MessageSquare,
  BookOpen, Zap, AlertCircle, ChevronDown,
  ArrowLeft, Loader2, CreditCard, Building2,
  ShieldCheck, Globe, Users, Star, ChevronRight,
  Check, Phone, Lock,
} from "lucide-react";

const CATEGORIES = [
  { value: "General", label: "General Question" },
  { value: "Billing", label: "Billing & Plans" },
  { value: "Technical", label: "Technical Issue" },
  { value: "Setup", label: "Widget Setup Help" },
  { value: "Feature", label: "Feature Request" },
  { value: "Bug", label: "Bug Report" },
  { value: "Account", label: "Account & Login" },
  { value: "Other", label: "Other" },
];

const FAQS = [
  { q: "How do I install the widget on my website?", a: "Copy the embed snippet from Dashboard → Chatbots → [Your Bot] → Embed Code, then paste it before the </body> tag of your website." },
  { q: "Why is my chatbot not responding?", a: "Make sure your chatbot status is set to Active, your OpenRouter API key is valid, and there are no allowed domain restrictions blocking your site." },
  { q: "Can I customize the widget color?", a: "Yes. Go to Dashboard → Chatbots → Edit your bot → Widget Appearance. You can choose from presets or pick any custom hex color." },
  { q: "How do I reply to conversations?", a: "Go to Dashboard → Conversations, click any conversation, and type your reply in the box at the bottom. Admin messages appear instantly to the visitor." },
  { q: "How does escalation work?", a: "When the AI includes the escalation keyword (default: ESCALATE) in its reply, the conversation is flagged and a notification is sent to your dashboard." },
];

export default function ContactPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [category, setCategory] = useState("General");
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [openFaq, setOpenFaq]   = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, category }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";

  /* ── styles ── */
  const input: React.CSSProperties = {
    width:"100%", padding:"0.75rem 1rem",
    background:"rgba(255,255,255,0.06)",
    border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:10, color:"#fff", fontSize:"0.9rem",
    outline:"none", boxSizing:"border-box",
    transition:"border-color 0.15s",
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#09090b 0%,#0f172a 55%,#0c1a30 100%)",
      fontFamily:"'Inter',sans-serif",
      color:"#fff",
    }}>
      {/* Nav */}
      <nav style={{ padding:"1.25rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" style={{ fontWeight:800,fontSize:"1.2rem",color:"#fff",textDecoration:"none",letterSpacing:"-0.03em" }}>
          MJ<span style={{ color:"#1dbfa0" }}>.</span>TALK
        </Link>
        <Link href="/dashboard" style={{ fontSize:"0.85rem",color:"rgba(255,255,255,0.5)",textDecoration:"none",display:"flex",alignItems:"center",gap:"0.4rem" }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </nav>

      <div style={{ maxWidth:1100,margin:"0 auto",padding:"3rem 1.5rem" }}>

        {/* Header */}
        <div style={{ textAlign:"center",marginBottom:"3.5rem" }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:"0.5rem",background:"rgba(13,133,133,0.15)",border:"1px solid rgba(13,133,133,0.3)",color:"#1dbfa0",padding:"0.3rem 0.9rem",borderRadius:999,fontSize:"0.75rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"1rem" }}>
            <Zap size={12} /> Support Center
          </div>
          <h1 style={{ fontSize:"clamp(2rem,4vw,2.8rem)",fontWeight:800,letterSpacing:"-0.03em",marginBottom:"0.75rem" }}>
            How can we help?
          </h1>
          <p style={{ color:"rgba(255,255,255,0.5)",fontSize:"1rem",maxWidth:480,margin:"0 auto" }}>
            Reach out with any question — we typically reply within a few hours.
          </p>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3rem",alignItems:"start" }}>

          {/* ── Left: Form ── */}
          <div>
            {success ? (
              <div style={{ background:"rgba(13,133,133,0.1)",border:"1px solid rgba(13,133,133,0.3)",borderRadius:16,padding:"3rem 2rem",textAlign:"center" }}>
                <CheckCircle2 size={48} color="#0d8585" style={{ margin:"0 auto 1.25rem" }} />
                <h2 style={{ fontSize:"1.4rem",fontWeight:800,marginBottom:"0.5rem" }}>Message sent! ✓</h2>
                <p style={{ color:"rgba(255,255,255,0.5)",lineHeight:1.7,marginBottom:"2rem" }}>
                  Thanks for reaching out. We've emailed a confirmation to <strong style={{ color:"#1dbfa0" }}>{email}</strong> and will reply within 24 hours.
                </p>
                <div style={{ display:"flex",gap:"1rem",justifyContent:"center" }}>
                  <button onClick={() => { setSuccess(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }} style={{ padding:"0.7rem 1.5rem",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>
                    Send another
                  </button>
                  <Link href="/dashboard" style={{ padding:"0.7rem 1.5rem",background:"linear-gradient(135deg,#0d8585,#14a085)",borderRadius:8,color:"#fff",fontWeight:700,fontSize:"0.875rem",textDecoration:"none" }}>
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"2rem" }}>
                <h2 style={{ fontSize:"1.1rem",fontWeight:700,marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:"0.5rem" }}>
                  <MessageSquare size={18} color="#0d8585" /> Send a Message
                </h2>

                {error && (
                  <div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",padding:"0.75rem 1rem",borderRadius:8,marginBottom:"1.25rem",fontSize:"0.85rem",display:"flex",alignItems:"flex-start",gap:"0.5rem" }}>
                    <AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }} /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:"1rem" }}>
                  {/* Name + email row */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
                    <div>
                      <label style={{ display:"block",fontSize:"0.78rem",fontWeight:600,color:"rgba(255,255,255,0.55)",marginBottom:"0.4rem" }}>Full Name *</label>
                      <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith" required style={input}
                        onFocus={e=>e.target.style.borderColor="#0d8585"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
                    </div>
                    <div>
                      <label style={{ display:"block",fontSize:"0.78rem",fontWeight:600,color:"rgba(255,255,255,0.55)",marginBottom:"0.4rem" }}>Email *</label>
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={input}
                        onFocus={e=>e.target.style.borderColor="#0d8585"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label style={{ display:"block",fontSize:"0.78rem",fontWeight:600,color:"rgba(255,255,255,0.55)",marginBottom:"0.4rem" }}>Category</label>
                    <select value={category} onChange={e=>setCategory(e.target.value)} style={{ ...input,cursor:"pointer" }}>
                      {CATEGORIES.map(c=>(
                        <option key={c.value} value={c.value} style={{ background:"#1a1a2e" }}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label style={{ display:"block",fontSize:"0.78rem",fontWeight:600,color:"rgba(255,255,255,0.55)",marginBottom:"0.4rem" }}>Subject</label>
                    <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief description of your issue" style={input}
                      onFocus={e=>e.target.style.borderColor="#0d8585"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
                  </div>

                  {/* Message */}
                  <div>
                    <label style={{ display:"block",fontSize:"0.78rem",fontWeight:600,color:"rgba(255,255,255,0.55)",marginBottom:"0.4rem" }}>Message *</label>
                    <textarea
                      value={message} onChange={e=>setMessage(e.target.value)}
                      placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, or relevant URLs."
                      required rows={5}
                      style={{ ...input,resize:"vertical",minHeight:120,lineHeight:1.6 }}
                      onFocus={e=>e.target.style.borderColor="#0d8585"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
                    />
                    <p style={{ fontSize:"0.75rem",color:"rgba(255,255,255,0.25)",marginTop:"0.25rem" }}>
                      {message.length}/2000 characters
                    </p>
                  </div>

                  <button
                    type="submit" disabled={loading}
                    style={{ padding:"0.85rem",background:loading?"rgba(13,133,133,0.5)":"linear-gradient(135deg,#0d8585,#14a085)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,fontSize:"0.95rem",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",transition:"opacity 0.15s" }}
                    onMouseEnter={e=>{if(!loading)e.currentTarget.style.opacity="0.9"}}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                  >
                    {loading ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> Sending...</> : <><Send size={16} /> Send Message</>}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ── Right: Contact options + FAQ ── */}
          <div style={{ display:"flex",flexDirection:"column",gap:"1.5rem" }}>

            {/* Direct contact */}
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.5rem" }}>
              <h3 style={{ fontSize:"0.95rem",fontWeight:700,marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem" }}>
                <Mail size={16} color="#0d8585" /> Other ways to reach us
              </h3>
              <a href={`mailto:${supportEmail}`} style={{ display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"rgba(13,133,133,0.1)",border:"1px solid rgba(13,133,133,0.2)",borderRadius:10,textDecoration:"none",color:"#fff",marginBottom:"0.75rem",transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(13,133,133,0.2)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(13,133,133,0.1)"}
              >
                <div style={{ width:36,height:36,borderRadius:8,background:"rgba(13,133,133,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Mail size={16} color="#1dbfa0" />
                </div>
                <div>
                  <div style={{ fontWeight:600,fontSize:"0.875rem" }}>Email Support</div>
                  <div style={{ color:"#1dbfa0",fontSize:"0.8rem" }}>{supportEmail}</div>
                </div>
              </a>
              <div style={{ display:"flex",gap:"0.5rem",padding:"0.75rem",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ width:36,height:36,borderRadius:8,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Zap size={16} color="#f97316" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600,fontSize:"0.875rem" }}>Average Response Time</div>
                  <div style={{ color:"rgba(255,255,255,0.45)",fontSize:"0.8rem" }}>Under 24 hours · Mon–Sat</div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.5rem" }}>
              <h3 style={{ fontSize:"0.95rem",fontWeight:700,marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem" }}>
                <BookOpen size={16} color="#0d8585" /> Frequently Asked Questions
              </h3>
              <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
                {FAQS.map((faq,i) => (
                  <div key={i} style={{ border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,overflow:"hidden" }}>
                    <button
                      onClick={()=>setOpenFaq(openFaq===i?null:i)}
                      style={{ width:"100%",padding:"0.85rem 1rem",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"0.75rem",textAlign:"left" }}
                    >
                      <span style={{ color:"#fff",fontSize:"0.875rem",fontWeight:600,flex:1 }}>{faq.q}</span>
                      <ChevronDown size={15} color="rgba(255,255,255,0.4)" style={{ flexShrink:0,transform:openFaq===i?"rotate(180deg)":"none",transition:"transform 0.2s" }} />
                    </button>
                    {openFaq===i && (
                      <div style={{ padding:"0 1rem 0.875rem",color:"rgba(255,255,255,0.6)",fontSize:"0.85rem",lineHeight:1.6 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        input::placeholder,textarea::placeholder { color:rgba(255,255,255,0.25)!important; }
        select option { background:#1a1a2e; }
        @media(max-width:768px){
          .contact-grid { grid-template-columns:1fr!important; }
        }
      `}</style>
    </div>
  );
}
