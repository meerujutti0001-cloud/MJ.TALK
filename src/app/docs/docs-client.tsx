"use client";

import Link from "next/link";
import {
  Bot, Users, Zap, BookOpen, Code2, Settings2,
  MessageSquare, Shield, ArrowRight, ChevronRight,
} from "lucide-react";

const APP_NAME = "MJ.TALK";
const SUPPORT_EMAIL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPPORT_EMAIL) ||
  "support@mjtalk.com";

/* ─── Colour tokens ─────────────────────────────── */
const C = {
  bg:      "#fff",
  navy:    "#0a1628",
  teal600: "#0d8585",
  teal400: "#1dbfa0",
  teal50:  "#edfaf7",
  teal100: "#d4f4ee",
  muted:   "#5a7878",
  mid:     "#2d4a4a",
  border:  "#e5e7eb",
  codeBg:  "#f3f4f6",
};

/* ─── Sidebar sections ──────────────────────────── */
const sections = [
  { id: "quickstart",  label: "Quick Start",       icon: Zap },
  { id: "widget",      label: "Widget Setup",       icon: Code2 },
  { id: "agents",      label: "Adding Agents",      icon: Users },
  { id: "ai",          label: "Enabling AI",        icon: Bot },
  { id: "handoff",     label: "Human Handoff",      icon: MessageSquare },
  { id: "knowledge",   label: "Knowledge Base",     icon: BookOpen },
  { id: "settings",    label: "Settings & Plans",   icon: Settings2 },
  { id: "security",    label: "Security & Privacy", icon: Shield },
];

/* ═══════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════ */
export function DocsPageClient() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", color: C.navy }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "1rem 2rem", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)",
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", color: C.teal600, textDecoration: "none", letterSpacing: "-0.04em" }}>
          MJ<span style={{ color: C.teal400 }}>.</span>TALK
        </Link>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", fontSize: "0.875rem" }}>
          <Link href="/contact" style={{ color: C.muted, textDecoration: "none" }}>Support</Link>
          <Link href="/dashboard" style={{
            background: C.teal600, color: "#fff",
            padding: "0.4rem 1rem", borderRadius: "6px",
            fontWeight: 600, textDecoration: "none", fontSize: "0.825rem",
          }}>Dashboard →</Link>
        </div>
      </nav>

      {/* Layout */}
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "3rem 2rem 6rem",
        display: "grid", gridTemplateColumns: "220px 1fr",
        gap: "4rem", alignItems: "start",
      }}>

        {/* ── Sidebar ── */}
        <aside style={{ position: "sticky", top: "80px" }}>
          <p style={{
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.muted, marginBottom: "0.75rem",
          }}>Contents</p>
          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.45rem 0.6rem", borderRadius: "7px",
                  fontSize: "0.85rem", color: C.mid, textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.teal50; e.currentTarget.style.color = C.teal600; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.mid; }}
              >
                <s.icon size={14} />
                {s.label}
              </a>
            ))}
          </nav>

          {/* Help card */}
          <div style={{
            marginTop: "2rem", padding: "1rem",
            background: C.teal50, borderRadius: "10px",
            border: `1px solid ${C.teal100}`,
          }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: C.teal600, marginBottom: "0.4rem" }}>Still stuck?</p>
            <p style={{ fontSize: "0.75rem", color: C.muted, lineHeight: 1.6, marginBottom: "0.75rem" }}>
              Our support team replies within 24 hours.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              fontSize: "0.78rem", fontWeight: 600, color: C.teal600, textDecoration: "none",
            }}>
              Email support <ArrowRight size={12} />
            </a>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main>
          {/* Header */}
          <div style={{ marginBottom: "3rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              background: C.teal50, border: `1px solid ${C.teal100}`,
              color: C.teal600, padding: "0.25rem 0.75rem", borderRadius: "999px",
              fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", marginBottom: "1rem",
            }}>
              <BookOpen size={11} /> Documentation
            </div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
              Get started with {APP_NAME}
            </h1>
            <p style={{ fontSize: "1rem", color: C.muted, lineHeight: 1.7, maxWidth: "560px" }}>
              Everything you need to deploy your first chatbot, onboard your team,
              and configure the AI + human support workflow.
            </p>
          </div>

          {/* 1 — Quick Start */}
          <DocSection id="quickstart" title="Quick Start" icon={Zap}>
            <p>From signup to a live chat widget in under five minutes:</p>
            <Steps items={[
              {
                title: "Create your account",
                body: <>Go to <Link href="/signup" style={{ color: C.teal600 }}>mjtalk.com/signup</Link> and create a free account. No credit card needed.</>,
              },
              {
                title: "Create your first chatbot",
                body: <>In the dashboard, click <strong>Chatbots → New Chatbot</strong>. Give it a name, pick a colour, and save.</>,
              },
              {
                title: "Copy the embed snippet",
                body: <>Open your chatbot → <strong>Embed Code</strong> tab. Copy the one-line <Code>&lt;script&gt;</Code> tag.</>,
              },
              {
                title: "Paste it into your site",
                body: <>Add the snippet just before <Code>&lt;/body&gt;</Code> on every page where you want the widget to appear.</>,
              },
              {
                title: "Test it",
                body: "Visit your site — the chat bubble should appear in the corner. Click it to start a test conversation.",
              },
            ]} />
            <Callout type="tip">
              On <strong>WordPress</strong>, paste the snippet in <em>Appearance → Theme Editor → footer.php</em>,
              or use a &ldquo;Custom HTML&rdquo; widget. On <strong>Shopify</strong>, go to{" "}
              <em>Online Store → Themes → Edit code → theme.liquid</em>.
            </Callout>
          </DocSection>

          {/* 2 — Widget Setup */}
          <DocSection id="widget" title="Widget Setup" icon={Code2}>
            <p>Customise your widget from <strong>Dashboard → Chatbots → Edit</strong>:</p>
            <DocList items={[
              <><strong>Name &amp; Avatar</strong> — The name shown in the chat header. Upload a logo or use the auto-generated initials.</>,
              <><strong>Brand colour</strong> — Pick any hex colour. The widget header, send button, and agent bubble all update instantly.</>,
              <><strong>Greeting message</strong> — Set the opening message visitors see when they first open the widget.</>,
              <><strong>Pre-chat form</strong> — Optionally collect visitor name and email before the conversation starts.</>,
              <><strong>Allowed domains</strong> — Lock the widget to specific domains so the embed code only works on your sites.</>,
              <><strong>Escalation keyword</strong> — The word (default: <Code>ESCALATE</Code>) that triggers a human handoff when the AI uses it in a reply.</>,
            ]} />
            <Callout type="info">
              Widget appearance changes are live immediately — no re-deploying the embed snippet needed.
            </Callout>
          </DocSection>

          {/* 3 — Adding Agents */}
          <DocSection id="agents" title="Adding Agents" icon={Users}>
            <p>Agents are team members who can view and reply to conversations from the dashboard.</p>
            <Steps items={[
              { title: "Go to Team", body: <>In the sidebar, click <strong>Team</strong>.</> },
              { title: "Invite by email", body: "Enter the agent's email and click Invite. They receive a signup link by email." },
              { title: "Agent accepts the invite", body: <>The agent clicks the link, sets a password, and lands in the <strong>Conversations</strong> inbox.</> },
              { title: "Assign conversations", body: "From any open conversation, click Assign and select the agent. They get a notification immediately." },
            ]} />
            <DocList items={[
              <><strong>Agent role</strong> — Can view and reply to conversations. Cannot change chatbot settings or billing.</>,
              <><strong>Owner role</strong> — Full access: settings, billing, chatbot config, team management.</>,
            ]} />
          </DocSection>

          {/* 4 — Enabling AI */}
          <DocSection id="ai" title="Enabling AI Replies" icon={Bot}>
            <p>
              {APP_NAME} uses your OpenRouter API key to power AI replies. The AI reads your system prompt
              and Knowledge Base to answer questions automatically.
            </p>
            <Steps items={[
              {
                title: "Get an OpenRouter key",
                body: <><a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" style={{ color: C.teal600 }}>openrouter.ai</a> → sign up → API Keys → Create key.</>,
              },
              {
                title: "Add it to your environment",
                body: <>Set <Code>OPENROUTER_API_KEY=sk-or-…</Code> in your Vercel project environment variables (or <Code>.env.local</Code> locally), then redeploy.</>,
              },
              {
                title: "Write a system prompt",
                body: <>In Dashboard → Chatbots → Edit → <strong>AI Settings</strong>, write instructions for the AI: your product name, tone, topics to handle, and when to escalate.</>,
              },
              {
                title: "Test the AI",
                body: "Open the widget on your site and ask a question. The AI should reply based on your system prompt.",
              },
            ]} />
            <Callout type="tip">
              Add articles to the <strong>Knowledge Base</strong> (see below) so the AI searches them before replying,
              giving more accurate answers than the system prompt alone.
            </Callout>
          </DocSection>

          {/* 5 — Human Handoff */}
          <DocSection id="handoff" title="Human Handoff" icon={MessageSquare}>
            <p>
              When a visitor clicks <strong>&ldquo;Talk to a Human Agent&rdquo;</strong> or the AI decides it
              cannot help, the conversation escalates to your human agents.
            </p>
            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "1.5rem", marginBottom: "0.5rem", color: C.navy }}>
              How escalation works
            </h4>
            <Steps items={[
              {
                title: "Visitor requests a human",
                body: "The visitor clicks the \"Talk to Human Agent\" button, or the AI includes the escalation keyword in its reply.",
              },
              {
                title: "Conversation status changes",
                body: <>Status moves: <StatusBadge color="blue">Bot Active</StatusBadge> → <StatusBadge color="yellow">Handoff Requested</StatusBadge> → <StatusBadge color="orange">Waiting for Agent</StatusBadge></>,
              },
              {
                title: "Admin gets notified",
                body: "A notification appears in Dashboard → Notifications and the unread badge updates in real time.",
              },
              {
                title: "Agent accepts and replies",
                body: <>Agent opens the conversation, clicks <strong>Assign to me</strong>, and starts typing. Status becomes <StatusBadge color="green">Agent Assigned</StatusBadge>.</>,
              },
              {
                title: "AI goes passive",
                body: "Once a human agent is assigned, the AI stops auto-replying. Only the agent's messages go to the visitor.",
              },
              {
                title: "Conversation resolved",
                body: <>Agent clicks <strong>Close</strong> when done. Status moves to <StatusBadge color="gray">Resolved</StatusBadge>. The visitor can re-open by sending a new message.</>,
              },
            ]} />
            <Callout type="info">
              The visitor sees: <em>&ldquo;A support agent has been notified and will join shortly.&rdquo;</em> — displayed automatically when escalation is triggered.
            </Callout>

            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "1.75rem", marginBottom: "0.75rem", color: C.navy }}>
              Conversation status reference
            </h4>
            <DocList items={[
              <><StatusBadge color="blue">Bot Active</StatusBadge> — AI is handling the conversation.</>,
              <><StatusBadge color="yellow">Handoff Requested</StatusBadge> — Visitor asked for a human; waiting for agent acceptance.</>,
              <><StatusBadge color="orange">Waiting for Agent</StatusBadge> — Escalation confirmed; no agent assigned yet.</>,
              <><StatusBadge color="green">Agent Assigned</StatusBadge> — Human agent is actively in the conversation.</>,
              <><StatusBadge color="gray">Resolved</StatusBadge> — Closed by agent or auto-resolved after inactivity.</>,
            ]} />
          </DocSection>

          {/* 6 — Knowledge Base */}
          <DocSection id="knowledge" title="Knowledge Base" icon={BookOpen}>
            <p>
              The Knowledge Base lets you write articles the AI searches before replying — giving accurate,
              up-to-date answers without writing long system prompts.
            </p>
            <Steps items={[
              { title: "Open a chatbot → Knowledge Base tab", body: "Navigate to Dashboard → Chatbots, open a chatbot, and click the Knowledge Base tab." },
              { title: "Create an article", body: "Click New Article, choose a category (Account, Payment, Refund, Technical, Setup, FAQ), write the content, and publish." },
              { title: "Mark as published", body: "Only published articles are used by the AI. Drafts are saved but not searched." },
              { title: "Test it", body: "Ask the AI a related question in the widget — it should use the article content in its reply." },
            ]} />
            <Callout type="tip">
              Keep articles focused on one topic each. The AI performs better with many short, specific articles
              than one long general document.
            </Callout>
          </DocSection>

          {/* 7 — Settings & Plans */}
          <DocSection id="settings" title="Settings & Plans" icon={Settings2}>
            <DocList items={[
              <><strong>Workspace name</strong> — Dashboard → Settings → General.</>,
              <><strong>Change email / password</strong> — Dashboard → Settings → Account.</>,
              <><strong>Upgrade plan</strong> — Dashboard → Settings → Billing, or go to{" "}
                <Link href="/purchase/premium" style={{ color: C.teal600 }}>Purchase Premium</Link>.
                Plans: Starter (Free), Growth ($29/mo), Enterprise (custom).</>,
              <><strong>Delete account</strong> — Dashboard → Settings → Danger Zone → Delete Account.
                All data is purged within 30 days per our{" "}
                <Link href="/privacy" style={{ color: C.teal600 }}>Privacy Policy</Link>.</>,
            ]} />
          </DocSection>

          {/* 8 — Security */}
          <DocSection id="security" title="Security & Privacy" icon={Shield}>
            <DocList items={[
              <><strong>Data in transit</strong> — All communication is encrypted via HTTPS/TLS.</>,
              <><strong>Passwords</strong> — Stored as bcrypt hashes. Plaintext passwords are never stored.</>,
              <><strong>Row-level security</strong> — Your organisation&apos;s data is isolated at the database level.</>,
              <><strong>AI data handling</strong> — Only message text is sent to OpenRouter. No account data is shared.</>,
              <><strong>GDPR / CCPA</strong> — Export or delete all conversation data from the dashboard at any time.
                See our <Link href="/privacy" style={{ color: C.teal600 }}>Privacy Policy</Link>.</>,
              <><strong>Cookies</strong> — Only essential session cookies and one anonymised analytics cookie.
                See our <Link href="/cookies" style={{ color: C.teal600 }}>Cookie Policy</Link>.</>,
            ]} />
          </DocSection>

          {/* Footer CTA */}
          <div style={{
            marginTop: "4rem", padding: "2rem",
            background: "linear-gradient(135deg, #042e2e, #064f50)",
            borderRadius: "16px", textAlign: "center",
          }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Something not covered here?
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              Email us and we typically reply within a few hours.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              background: C.teal400, color: "#042e2e",
              padding: "0.65rem 1.5rem", borderRadius: "8px",
              fontWeight: 700, fontSize: "0.875rem", textDecoration: "none",
            }}>
              Contact Support <ChevronRight size={14} />
            </a>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: "1.5rem 2rem", textAlign: "center",
        fontSize: "0.8rem", color: "#9ca3af",
      }}>
        © {new Date().getFullYear()} {APP_NAME} ·{" "}
        <Link href="/privacy" style={{ color: "#9ca3af" }}>Privacy</Link> ·{" "}
        <Link href="/terms" style={{ color: "#9ca3af" }}>Terms</Link> ·{" "}
        <Link href="/cookies" style={{ color: "#9ca3af" }}>Cookies</Link>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .docs-layout { grid-template-columns: 1fr !important; }
          .docs-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REUSABLE COMPONENTS
═══════════════════════════════════════════════════ */

function DocSection({
  id, title, icon: Icon, children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: "3.5rem", scrollMarginTop: "100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1.1rem" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "9px",
          background: C.teal50, border: `1px solid ${C.teal100}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={18} color={C.teal600} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: C.navy, margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ fontSize: "0.9rem", color: C.mid, lineHeight: 1.75 }}>
        {children}
      </div>
      <div style={{ borderBottom: `1px solid ${C.border}`, marginTop: "2.5rem" }} />
    </section>
  );
}

function Steps({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <ol style={{
      listStyle: "none", padding: 0,
      margin: "1.25rem 0",
      display: "flex", flexDirection: "column", gap: "1rem",
    }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{
            minWidth: "26px", height: "26px", borderRadius: "50%",
            background: C.teal600, color: "#fff",
            fontSize: "0.72rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: "1px",
          }}>
            {i + 1}
          </div>
          <div>
            <p style={{ fontWeight: 700, color: C.navy, margin: "0 0 0.2rem" }}>{item.title}</p>
            <p style={{ color: C.mid, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DocList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{
      paddingLeft: "1.25rem", margin: "1rem 0",
      display: "flex", flexDirection: "column", gap: "0.65rem",
    }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: C.mid, lineHeight: 1.65 }}>{item}</li>
      ))}
    </ul>
  );
}

function Callout({ type, children }: { type: "tip" | "info" | "warning"; children: React.ReactNode }) {
  const s = {
    tip:     { bg: C.teal50,  border: C.teal100, label: "💡 Tip",      labelColor: C.teal600 },
    info:    { bg: "#eff6ff", border: "#bfdbfe", label: "ℹ️ Note",     labelColor: "#1d4ed8" },
    warning: { bg: "#fffbeb", border: "#fde68a", label: "⚠️ Warning",  labelColor: "#92400e" },
  }[type];

  return (
    <div style={{
      margin: "1.25rem 0", padding: "0.85rem 1rem",
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: "10px", fontSize: "0.875rem", lineHeight: 1.7, color: C.mid,
    }}>
      <span style={{ fontWeight: 700, color: s.labelColor, marginRight: "0.5rem" }}>{s.label}</span>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      background: C.codeBg, padding: "1px 6px", borderRadius: "4px",
      fontSize: "0.85em",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      color: C.teal600,
    }}>
      {children}
    </code>
  );
}

function StatusBadge({
  color, children,
}: {
  color: "blue" | "yellow" | "orange" | "green" | "gray";
  children: React.ReactNode;
}) {
  const colors = {
    blue:   { bg: "#dbeafe", text: "#1d4ed8" },
    yellow: { bg: "#fef3c7", text: "#92400e" },
    orange: { bg: "#ffedd5", text: "#9a3412" },
    green:  { bg: "#d1fae5", text: "#065f46" },
    gray:   { bg: "#f3f4f6", text: "#4b5563" },
  }[color];

  return (
    <span style={{
      display: "inline-block",
      padding: "1px 8px", borderRadius: "999px",
      fontSize: "0.78em", fontWeight: 600,
      background: colors.bg, color: colors.text,
    }}>
      {children}
    </span>
  );
}
