"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowRight, Check, Star, Bot, Users } from "lucide-react";

/*
  CSS variables from HTML (exact copy):
  --teal-900:#042e2e  --teal-800:#064f50  --teal-700:#0a7070
  --teal-600:#0d8585  --teal-500:#14a085  --teal-400:#1dbfa0
  --teal-300:#4dd4b8  --teal-200:#9eeade  --teal-100:#d4f4ee
  --teal-50:#edfaf7   --navy:#0a1628
  --text-dark:#0a1628 --text-mid:#2d4a4a  --text-muted:#5a7878
*/

/* ══════════════════════════════════════════
   NAVBAR  — white bg, teal logo (exact HTML)
══════════════════════════════════════════ */
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Features", "Pricing", "Integrations", "Docs"];

  const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid #d4f4ee",
      padding: "0 2.5rem", height: "64px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Logo — Syne font, teal */}
      <Link href="/" style={{
        fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 800,
        fontSize: "1.3rem", color: "#0a7070",
        textDecoration: "none",
      }}>
        MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex" style={{ gap: "2rem", alignItems: "center" }}>
        {links.map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{
            fontSize: "0.875rem", fontWeight: 500, color: "#5a7878",
            textDecoration: "none", transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0d8585")}
            onMouseLeave={e => (e.currentTarget.style.color = "#5a7878")}
          >{l}</a>
        ))}
        <Link href="/login" style={{
          fontSize: "0.875rem", fontWeight: 500, color: "#5a7878",
          textDecoration: "none",
        }}>Sign In</Link>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Enquiry`}
          style={{
            fontSize: "0.875rem", fontWeight: 500, color: "#0d8585",
            textDecoration: "none", border: "1.5px solid #1dbfa0",
            padding: "0.4rem 1rem", borderRadius: "6px",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#edfaf7"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >Contact Support</a>
        <Link href="/signup" style={{
          background: "#0d8585", color: "#fff",
          padding: "0.5rem 1.25rem", borderRadius: "6px",
          fontSize: "0.875rem", fontWeight: 600,
          textDecoration: "none", transition: "background 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#0a7070")}
          onMouseLeave={e => (e.currentTarget.style.background = "#0d8585")}
        >Get Started Free</Link>
      </div>

      {/* Mobile hamburger */}
      <button className="md:hidden" onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#0a7070" }}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: "absolute", top: "64px", left: 0, right: 0,
          background: "#fff", borderBottom: "1px solid #d4f4ee",
          padding: "1rem 2rem", display: "flex", flexDirection: "column", gap: "0.75rem",
        }}>
          {[...links, "Sign In"].map(l => (
            <a key={l} href="#" onClick={() => setOpen(false)} style={{
              fontSize: "0.9rem", fontWeight: 500, color: "#5a7878", textDecoration: "none",
            }}>{l}</a>
          ))}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Enquiry`}
            onClick={() => setOpen(false)}
            style={{
              fontSize: "0.9rem", fontWeight: 600, color: "#0d8585", textDecoration: "none",
            }}
          >Contact Support</a>
          <Link href="/signup" onClick={() => setOpen(false)} style={{
            background: "#0d8585", color: "#fff", padding: "0.6rem 1rem",
            borderRadius: "6px", fontSize: "0.875rem", fontWeight: 600,
            textDecoration: "none", textAlign: "center",
          }}>Get Started Free</Link>
        </div>
      )}
    </nav>
  );
}

/* ══════════════════════════════════════════
   HERO  — navy→teal-800→teal-600 gradient
══════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{
      background: "linear-gradient(135deg, #0a1628 0%, #064f50 60%, #0d8585 100%)",
      minHeight: "88vh",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      alignItems: "center",
      padding: "5rem 2.5rem 4rem",
      paddingTop: "7rem",
      gap: "3rem",
      position: "relative", overflow: "hidden",
    }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 60% at 70% 40%, rgba(20,160,133,0.18) 0%, transparent 70%)",
      }} />

      {/* Left */}
      <div style={{ position: "relative" }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          background: "rgba(77,212,184,0.15)", border: "1px solid rgba(77,212,184,0.3)",
          color: "#4dd4b8", padding: "0.3rem 0.75rem", borderRadius: "999px",
          fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: "1.5rem",
        }}>
          <span style={{
            width: "6px", height: "6px", background: "#1dbfa0",
            borderRadius: "50%", display: "inline-block",
            animation: "pulse 2s infinite",
          }} />
          Now with AI-Powered Replies
        </div>

        {/* Headline — Syne */}
        <h1 style={{
          fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed",
          fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
          fontWeight: 800, color: "#fff",
          lineHeight: 1.1,
          marginBottom: "1.25rem",
        }}>
          Talk to every visitor.<br />
          <em style={{ fontStyle: "normal", color: "#4dd4b8" }}>Convert more, faster.</em>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: "1.05rem", color: "rgba(255,255,255,0.72)",
          lineHeight: 1.7, maxWidth: "480px", marginBottom: "2rem",
        }}>
          MJ.TALK puts a live support agent — or a smart AI bot — in your
          customers&apos; hands the moment they land on your site. Zero friction, real results.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "2.5rem" }}>
          <Link href="/signup" style={{
            background: "#1dbfa0", color: "#0a1628",
            padding: "0.75rem 1.75rem", borderRadius: "7px",
            fontWeight: 700, fontSize: "0.95rem",
            textDecoration: "none", display: "inline-block",
            transition: "background 0.2s, transform 0.1s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#4dd4b8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1dbfa0"; e.currentTarget.style.transform = "none"; }}
          >Start Free — No Card Needed</Link>
          <a href="#how-it-works" style={{
            border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff",
            padding: "0.75rem 1.5rem", borderRadius: "7px",
            fontWeight: 500, fontSize: "0.95rem", textDecoration: "none",
            transition: "border-color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
          >See it in action →</a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "2.5rem" }}>
          {[
            { val: "35K+", label: "Businesses using MJ.TALK" },
            { val: "99.9%", label: "Uptime guaranteed" },
            { val: "4.2s", label: "Avg. first response" },
          ].map(s => (
            <div key={s.val}>
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>{s.val}</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: "0.15rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Chat widget */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
        <ChatWidget />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes typing-dot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        .typing-dot:nth-child(1){animation:typing-dot 1.2s ease-in-out infinite}
        .typing-dot:nth-child(2){animation:typing-dot 1.2s ease-in-out 0.2s infinite}
        .typing-dot:nth-child(3){animation:typing-dot 1.2s ease-in-out 0.4s infinite}
        .feat-card:hover { border-color: #4dd4b8 !important; transform: translateY(-2px); }
        .feat-card:hover .feat-bar { transform: scaleY(1) !important; }
        .price-card:hover { transform: translateY(-3px); }
        .plan-btn:hover { opacity: 0.88; }
        * { box-sizing: border-box; }
        body { font-family: var(--font-inter, 'Inter', sans-serif); }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ── Chat Widget (exact HTML structure) ── */
function ChatWidget() {
  return (
    <div style={{
      background: "#fff", borderRadius: "16px", width: "320px",
      boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
      overflow: "hidden",
    }}>
      {/* Header — teal-700 */}
      <div style={{
        background: "#0a7070", padding: "1rem 1.1rem",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "#1dbfa0", display: "flex", alignItems: "center",
          justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed",
          fontWeight: 700, fontSize: "0.8rem", color: "#042e2e", flexShrink: 0,
        }}>MJ</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>MJ.TALK Support</div>
          <div style={{ fontSize: "0.72rem", color: "#9eeade", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "5px", height: "5px", background: "#4ade80", borderRadius: "50%", display: "inline-block" }} />
            Online — reply in seconds
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        padding: "1rem", background: "#f5fafa",
        display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "200px",
      }}>
        {/* Incoming */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{
            maxWidth: "82%", fontSize: "0.8rem", lineHeight: 1.5,
            borderRadius: "10px 10px 10px 3px", padding: "0.5rem 0.75rem",
            background: "#fff", color: "#0a1628",
            border: "1px solid #d4f4ee", alignSelf: "flex-start",
          }}>Hi there 👋 Welcome! How can I help you today?</div>
          <div style={{ fontSize: "0.65rem", color: "#8aa3a3", marginTop: "0.2rem" }}>12:01 PM</div>
        </div>

        {/* Outgoing */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{
            maxWidth: "82%", fontSize: "0.8rem", lineHeight: 1.5,
            borderRadius: "10px 10px 3px 10px", padding: "0.5rem 0.75rem",
            background: "#0d8585", color: "#fff", alignSelf: "flex-end",
          }}>I need help with my recent order.</div>
          <div style={{ fontSize: "0.65rem", color: "#8aa3a3", marginTop: "0.2rem", textAlign: "right" }}>12:02 PM</div>
        </div>

        {/* Incoming reply */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{
            maxWidth: "82%", fontSize: "0.8rem", lineHeight: 1.5,
            borderRadius: "10px 10px 10px 3px", padding: "0.5rem 0.75rem",
            background: "#fff", color: "#0a1628",
            border: "1px solid #d4f4ee", alignSelf: "flex-start",
          }}>Sure! Could you share your order ID so I can look that up right away?</div>
        </div>

        {/* Typing */}
        <div style={{
          display: "flex", gap: "4px", alignItems: "center",
          padding: "0.5rem 0.75rem", background: "#fff",
          borderRadius: "10px 10px 10px 3px", width: "fit-content",
          border: "1px solid #d4f4ee",
        }}>
          {[0, 1, 2].map(i => (
            <span key={i} className="typing-dot" style={{
              width: "6px", height: "6px", background: "#1dbfa0",
              borderRadius: "50%", display: "inline-block",
            }} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #d4f4ee", padding: "0.65rem 0.9rem",
        display: "flex", alignItems: "center", gap: "0.5rem", background: "#fff",
      }}>
        <div style={{
          flex: 1, fontSize: "0.8rem", color: "#5a7878",
          padding: "0.4rem 0.6rem", background: "#f5fafa",
          border: "1px solid #d4f4ee", borderRadius: "6px",
        }}>Type a message…</div>
        <div style={{
          width: "30px", height: "30px", background: "#0d8585",
          borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <ArrowRight size={14} color="#fff" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SOCIAL STRIP
══════════════════════════════════════════ */
function SocialStrip() {
  const brands = ["Shopify Partners", "WooCommerce", "Zendesk Users", "Intercom Migrants", "500+ Agencies"];
  return (
    <div style={{
      background: "#edfaf7", borderTop: "1px solid #d4f4ee", borderBottom: "1px solid #d4f4ee",
      padding: "1.25rem 2.5rem",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "3rem", flexWrap: "wrap",
    }}>
      <span style={{ fontSize: "0.78rem", color: "#5a7878", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Trusted by teams at
      </span>
      {brands.map(b => (
        <span key={b} style={{
          fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 700,
          fontSize: "0.88rem", color: "#0d8585", opacity: 0.65,
        }}>{b}</span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   FEATURES
══════════════════════════════════════════ */
const featureList = [
  { title: "Live Chat",         desc: "Engage visitors in real time with a beautifully designed widget that matches your brand in minutes.",                          icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { title: "AI Chatbot",        desc: "Deploy an AI agent that handles FAQs, qualifies leads, and escalates to humans when it matters most.",                       icon: "bot" },
  { title: "Visitor Analytics", desc: "See who's on your site, what they're looking at, and when to reach out for maximum conversion.",                             icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { title: "Team Inbox",        desc: "All conversations in one shared inbox. Assign, collaborate, and resolve faster as a team.",                                  icon: "users" },
  { title: "100+ Integrations", desc: "Connect MJ.TALK to your CRM, helpdesk, or e-commerce platform. Zapier, Slack, Shopify and more.",                          icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { title: "GDPR Compliant",    desc: "End-to-end encryption, data residency options, and full GDPR / CCPA compliance built in from day one.",                     icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
];

function Features() {
  return (
    <section id="features" style={{ padding: "5rem 2.5rem", background: "#fff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14a085", marginBottom: "0.75rem" }}>
          What you get
        </div>
        <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 700, color: "#0a1628", maxWidth: "560px", lineHeight: 1.2, marginBottom: "0.75rem" }}>
          Everything your support team needs, out of the box
        </h2>
        <p style={{ fontSize: "1rem", color: "#5a7878", maxWidth: "520px", lineHeight: 1.7, marginBottom: "3rem" }}>
          From real-time chat to automated AI responses, MJ.TALK gives you the full toolkit without the enterprise price tag.
        </p>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {featureList.map(f => (
            <div key={f.title} className="feat-card" style={{
              border: "1px solid #d4f4ee", borderRadius: "12px", padding: "1.75rem",
              transition: "border-color 0.2s, transform 0.15s", position: "relative", overflow: "hidden",
            }}>
              <div className="feat-bar" style={{
                position: "absolute", top: 0, left: 0, width: "3px", height: "100%",
                background: "#1dbfa0", transform: "scaleY(0)", transformOrigin: "top",
                transition: "transform 0.25s",
              }} />
              <div style={{
                width: "44px", height: "44px", background: "#edfaf7", borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem",
              }}>
                {f.icon === "bot" ? (
                  <Bot size={22} color="#0d8585" strokeWidth={1.8} />
                ) : f.icon === "users" ? (
                  <Users size={22} color="#0d8585" strokeWidth={1.8} />
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0d8585" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                )}
              </div>
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "1rem", fontWeight: 700, color: "#0a1628", marginBottom: "0.5rem" }}>{f.title}</div>
              <p style={{ fontSize: "0.875rem", color: "#5a7878", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { num: "01", title: "Add the widget snippet", desc: "Copy one line of JavaScript and paste it into your site's <head>. Works on any platform — WordPress, Webflow, Shopify, or custom code." },
    { num: "02", title: "Customize your chat widget", desc: "Set your brand color, greeting message, and agent profiles in the dashboard. No design skills needed." },
    { num: "03", title: "Start talking to customers", desc: "Reply from the web dashboard, iOS or Android app. Set up the AI bot to cover off-hours automatically." },
  ];
  const conversations = [
    { initials: "SL", name: "Sarah L.", msg: "Can I change my shipping address?", status: "Active" },
    { initials: "MK", name: "Mohammed K.", msg: "I need a refund for order #4821", status: "Waiting" },
    { initials: "JP", name: "Jenna P.", msg: "What's your return policy?", status: "Active" },
  ];

  return (
    <section id="how-it-works" style={{ padding: "5rem 2.5rem", background: "#f5fafa", borderTop: "1px solid #d4f4ee" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14a085", marginBottom: "0.75rem" }}>
          How it works
        </div>
        <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 700, color: "#0a1628", lineHeight: 1.2, marginBottom: "3rem" }}>
          Up and running in under five minutes
        </h2>

        <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {steps.map(s => (
              <div key={s.num} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                <div style={{
                  minWidth: "36px", height: "36px", background: "#0d8585", color: "#fff",
                  borderRadius: "8px", fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 700,
                  fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{s.num}</div>
                <div>
                  <h4 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem", color: "#0a1628" }}>{s.title}</h4>
                  <p style={{ fontSize: "0.875rem", color: "#5a7878", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard card */}
          <div style={{
            background: "#fff", borderRadius: "14px", border: "1px solid #d4f4ee",
            padding: "1.5rem", boxShadow: "0 8px 32px rgba(13,115,119,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 700, fontSize: "0.9rem", color: "#0a1628" }}>Live Conversations</div>
              <div style={{ background: "#edfaf7", color: "#0a7070", fontSize: "0.72rem", fontWeight: 600, padding: "0.25rem 0.6rem", borderRadius: "999px" }}>● 3 Active</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              {[{ val: "142", label: "Chats today" }, { val: "4.1s", label: "Avg. response" }, { val: "96%", label: "Satisfaction" }].map(m => (
                <div key={m.label} style={{ background: "#edfaf7", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                  <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "1.25rem", fontWeight: 700, color: "#0a7070" }}>{m.val}</div>
                  <div style={{ fontSize: "0.7rem", color: "#5a7878", marginTop: "0.1rem" }}>{m.label}</div>
                </div>
              ))}
            </div>
            {conversations.map((c, i) => (
              <div key={c.name} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.6rem 0", borderBottom: i < 2 ? "1px solid #edfaf7" : "none",
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "#d4f4ee", color: "#0a7070", fontSize: "0.65rem",
                  fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{c.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0a1628" }}>{c.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#5a7878", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.msg}</div>
                </div>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "999px", flexShrink: 0,
                  background: c.status === "Active" ? "#d1fae5" : "#fef3c7",
                  color: c.status === "Active" ? "#065f46" : "#92400e",
                }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   TESTIMONIALS  — teal-800 dark bg
══════════════════════════════════════════ */
const testimonials = [
  { quote: "We switched from Intercom and cut our support costs by 60%. The AI bot handles 70% of our incoming chats without any human intervention.", name: "Aisha Rahman", role: "Head of Customer Success, Nexora", initials: "AR" },
  { quote: "Setup took 4 minutes. The visitor tracking showed us exactly where customers were getting confused, and our conversions went up 22% in the first month.", name: "Tom Weiss", role: "Co-founder, Stackbloom", initials: "TW" },
  { quote: "Best live chat tool for the price. The team inbox means everyone on our 8-person support team is always on the same page — no dropped conversations.", name: "Priya Menon", role: "Operations Lead, Clarivex", initials: "PM" },
];

function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: "5rem 2.5rem", background: "#064f50" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4dd4b8", marginBottom: "0.75rem" }}>
          Customer stories
        </div>
        <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          Loved by support teams worldwide
        </h2>
        <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginTop: "3rem" }}>
          {testimonials.map(t => (
            <div key={t.name} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", padding: "1.5rem",
            }}>
              <div style={{ display: "flex", gap: "3px", marginBottom: "1rem" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="#4dd4b8" color="#4dd4b8" />
                ))}
              </div>
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "#14a085", color: "#042e2e", fontSize: "0.72rem",
                  fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{t.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   PRICING
══════════════════════════════════════════ */
const plans = [
  { name: "Starter", price: "Free", sub: "forever", desc: "Perfect for small sites and solo operators.", featured: false, cta: "Get started free", features: ["Up to 500 chats/month", "1 agent seat", "Live chat widget", "Email notifications", "Basic analytics"] },
  { name: "Growth", price: "$29", sub: "/month", desc: "For growing teams ready to scale support.", featured: true, cta: "Start 14-day trial", features: ["Unlimited chats", "Unlimited agents", "AI chatbot (1,000 replies/mo)", "Visitor tracking", "CRM integrations", "Priority support"] },
  { name: "Enterprise", price: "Custom", sub: "", desc: "Dedicated infrastructure for high-volume teams.", featured: false, cta: "Contact sales", features: ["Everything in Growth", "Unlimited AI replies", "White-label widget", "SLA guarantee", "Dedicated account manager", "SSO & advanced security"] },
];

function Pricing() {
  return (
    <section id="pricing" style={{ padding: "5rem 2.5rem", background: "#fff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14a085", marginBottom: "0.75rem" }}>
          Simple pricing
        </div>
        <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 700, color: "#0a1628", lineHeight: 1.2, margin: "0 auto 0.75rem" }}>
          No surprises. No per-agent fees.
        </h2>
        <p style={{ fontSize: "1rem", color: "#5a7878", maxWidth: "520px", lineHeight: 1.7, margin: "0 auto 3rem" }}>
          Every plan includes unlimited agents and the full feature set. Only pay for active conversations.
        </p>

        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
          {plans.map(p => (
            <div key={p.name} className="price-card" style={{
              border: p.featured ? "1px solid #1dbfa0" : "1px solid #d4f4ee",
              borderRadius: "14px", padding: "2rem", position: "relative",
              background: p.featured ? "#edfaf7" : "#fff",
              transition: "transform 0.15s",
            }}>
              {p.featured && (
                <div style={{
                  position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                  background: "#14a085", color: "#fff", fontSize: "0.72rem", fontWeight: 700,
                  letterSpacing: "0.05em", padding: "0.25rem 0.9rem", borderRadius: "999px", whiteSpace: "nowrap",
                }}>Most Popular</div>
              )}
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 700, fontSize: "0.9rem", color: "#0d8585", marginBottom: "0.5rem", textTransform: "uppercase",  }}>{p.name}</div>
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "2.2rem", fontWeight: 800, color: "#0a1628", lineHeight: 1, marginBottom: "0.25rem" }}>
                {p.price} <span style={{ fontSize: "1rem", fontWeight: 400, color: "#5a7878" }}>{p.sub}</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#5a7878", marginBottom: "1.5rem" }}>{p.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.75rem", textAlign: "left" }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: "0.83rem", color: "#2d4a4a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      width: "16px", height: "16px", flexShrink: 0,
                      background: "#d4f4ee", borderRadius: "50%",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={10} color="#0d8585" strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="plan-btn" style={{
                width: "100%", padding: "0.7rem", borderRadius: "7px", fontWeight: 600,
                fontSize: "0.875rem", textAlign: "center", display: "block",
                textDecoration: "none", transition: "all 0.2s",
                background: p.featured ? "#0d8585" : "transparent",
                color: p.featured ? "#fff" : "#0a7070",
                border: p.featured ? "1.5px solid #0d8585" : "1.5px solid #1dbfa0",
              }}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   CTA BANNER  — teal-700→teal-500 gradient
══════════════════════════════════════════ */
function CTABanner() {
  return (
    <section style={{
      padding: "5rem 2.5rem",
      background: "linear-gradient(135deg, #0a7070 0%, #14a085 100%)",
      textAlign: "center",
    }}>
      <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>
        Start your first conversation today
      </h2>
      <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", marginBottom: "2rem", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
        Join 35,000+ businesses using MJ.TALK to turn website visitors into loyal customers. Free forever, no credit card required.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/signup" style={{
          background: "#fff", color: "#0a7070",
          padding: "0.75rem 1.75rem", borderRadius: "7px",
          fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
          transition: "background 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#edfaf7")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >Create your free account</Link>
        <a href="#" style={{
          border: "1.5px solid rgba(255,255,255,0.35)", color: "#fff",
          padding: "0.75rem 1.5rem", borderRadius: "7px",
          fontWeight: 500, fontSize: "0.95rem", textDecoration: "none",
        }}>Book a demo</a>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   FOOTER  — navy bg
══════════════════════════════════════════ */
function Footer() {
  const cols = [
    { title: "Product", links: ["Live Chat", "AI Chatbot", "Team Inbox", "Analytics", "Integrations"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact Support"] },
    { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Security"] },
  ];
  return (
    <footer style={{ background: "#0a1628", padding: "3.5rem 2.5rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 800, fontSize: "1.2rem", color: "#fff", marginBottom: "0.75rem" }}>
              MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
            </div>
            <p style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: "240px" }}>
              Live chat and AI support for modern businesses. Talk to every visitor, convert more customers.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h5 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontStretch: "condensed", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
                {col.title}
              </h5>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {col.links.map(l => (
                  <li key={l}>
                    {l === "Contact Support" ? (
                      <a
                        href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com"}?subject=Support%20Enquiry`}
                        style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#4dd4b8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                      >{l}</a>
                    ) : (
                      <a href="#" style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#4dd4b8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                      >{l}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>© 2026 MJ.TALK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════
   ROOT
══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <Navbar />
      <Hero />
      <SocialStrip />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTABanner />
      <Footer />
    </div>
  );
}



