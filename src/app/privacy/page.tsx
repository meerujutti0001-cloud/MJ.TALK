import Link from "next/link";

const LAST_UPDATED = "June 2026";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";
const APP_NAME = "MJ.TALK";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mjtalk.com";

export const metadata = {
  title: "Privacy Policy — MJ.TALK",
  description: "How MJ.TALK collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif", color: "#0a1628" }}>
      {/* Nav */}
      <nav style={{ padding: "1.25rem 2rem", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0a7070", textDecoration: "none", letterSpacing: "-0.04em" }}>
          MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
        </Link>
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem" }}>
          <Link href="/terms" style={{ color: "#5a7878", textDecoration: "none" }}>Terms</Link>
          <Link href="/cookies" style={{ color: "#5a7878", textDecoration: "none" }}>Cookies</Link>
          <Link href="/contact" style={{ color: "#0d8585", textDecoration: "none", fontWeight: 600 }}>Contact</Link>
        </div>
      </nav>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 2rem 5rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#5a7878", marginBottom: "0.5rem" }}>Last updated: {LAST_UPDATED}</p>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>Privacy Policy</h1>
          <p style={{ color: "#5a7878", lineHeight: 1.7 }}>
            This policy explains what data {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, how we use it, and your rights as a user. We are committed to protecting your privacy and complying with applicable data-protection laws including the GDPR and CCPA.
          </p>
        </div>

        <LegalSection title="1. Who We Are">
          <p>{APP_NAME} is a live-chat and AI support platform. Our service is accessible at <a href={APP_URL} style={{ color: "#0d8585" }}>{APP_URL}</a>. You can reach our data controller at <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0d8585" }}>{SUPPORT_EMAIL}</a>.</p>
        </LegalSection>

        <LegalSection title="2. Data We Collect">
          <LegalList items={[
            "Account data — name, email address, hashed password when you sign up.",
            "Organisation data — your workspace name and plan details.",
            "Conversation data — messages exchanged between your visitors and your chatbot/agents, including visitor name, email (if provided), browser info, and page URL.",
            "Usage data — pages visited within the dashboard, features used, timestamps.",
            "Technical data — IP address, browser type, device type collected automatically.",
            "Payment data — handled entirely by our payment processor (Stripe). We do not store card numbers.",
          ]} />
        </LegalSection>

        <LegalSection title="3. How We Use Your Data">
          <LegalList items={[
            "To provide and operate the MJ.TALK service.",
            "To send transactional emails (account confirmation, password reset, billing receipts).",
            "To improve the product through aggregate, anonymised usage analysis.",
            "To respond to support requests you send us.",
            "To comply with legal obligations.",
          ]} />
          <p style={{ marginTop: "1rem" }}>We do not sell your personal data to third parties. We do not use your conversation data to train AI models without explicit consent.</p>
        </LegalSection>

        <LegalSection title="4. Legal Basis for Processing (GDPR)">
          <LegalList items={[
            "Contract performance — processing necessary to deliver the service you signed up for.",
            "Legitimate interest — aggregate analytics, fraud prevention, service security.",
            "Consent — where we ask for and receive your explicit consent (e.g. marketing emails).",
            "Legal obligation — where required by law.",
          ]} />
        </LegalSection>

        <LegalSection title="5. Data Retention">
          <p>We retain account data for as long as your account is active. Conversation data is retained for 12 months by default; you can delete conversations at any time from the dashboard. When you delete your account, all personal data is purged within 30 days, except where retention is required by law (e.g. billing records — 7 years).</p>
        </LegalSection>

        <LegalSection title="6. Data Sharing">
          <p>We share data only with:</p>
          <LegalList items={[
            "Supabase — our database and authentication infrastructure provider (EU data residency available).",
            "OpenRouter — AI model routing. Only the text of chat messages is sent; no account data.",
            "Resend — transactional email delivery.",
            "Stripe — payment processing. Governed by Stripe&apos;s own privacy policy.",
            "Vercel — hosting and edge infrastructure.",
          ]} />
          <p style={{ marginTop: "1rem" }}>All processors are bound by data-processing agreements and operate under GDPR-compliant terms.</p>
        </LegalSection>

        <LegalSection title="7. Your Rights">
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <LegalList items={[
            "Access the personal data we hold about you.",
            "Correct inaccurate data.",
            "Request deletion (&ldquo;right to be forgotten&rdquo;).",
            "Restrict or object to processing.",
            "Data portability — receive your data in a machine-readable format.",
            "Withdraw consent at any time without affecting prior processing.",
          ]} />
          <p style={{ marginTop: "1rem" }}>To exercise any right, email <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0d8585" }}>{SUPPORT_EMAIL}</a>. We will respond within 30 days.</p>
        </LegalSection>

        <LegalSection title="8. Cookies">
          <p>We use essential cookies for authentication sessions and one analytics cookie to understand aggregate usage. See our <Link href="/cookies" style={{ color: "#0d8585" }}>Cookie Policy</Link> for full details.</p>
        </LegalSection>

        <LegalSection title="9. Security">
          <p>All data is transmitted over HTTPS/TLS. Passwords are hashed using bcrypt. Database access is row-level secured and restricted to authenticated users. We perform regular security reviews and keep dependencies up to date.</p>
        </LegalSection>

        <LegalSection title="10. Children">
          <p>MJ.TALK is not directed at children under 16. We do not knowingly collect data from minors. If you believe we have inadvertently collected such data, contact us immediately.</p>
        </LegalSection>

        <LegalSection title="11. Changes to This Policy">
          <p>We may update this policy from time to time. Material changes will be notified by email or in-dashboard notice at least 14 days before taking effect. The date at the top of this page reflects the most recent revision.</p>
        </LegalSection>

        <LegalSection title="12. Contact">
          <p>Questions or complaints: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0d8585" }}>{SUPPORT_EMAIL}</a></p>
          <p style={{ marginTop: "0.5rem" }}>If you are located in the EU and are not satisfied with our response, you have the right to lodge a complaint with your local data-protection authority.</p>
        </LegalSection>
      </main>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "1.5rem 2rem", textAlign: "center", fontSize: "0.8rem", color: "#9ca3af" }}>
        © {new Date().getFullYear()} {APP_NAME} · <Link href="/terms" style={{ color: "#9ca3af" }}>Terms</Link> · <Link href="/cookies" style={{ color: "#9ca3af" }}>Cookies</Link>
      </footer>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #f3f4f6" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.75rem", color: "#0a1628" }}>{title}</h2>
      <div style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ul>
  );
}
