import Link from "next/link";

const LAST_UPDATED = "June 2026";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";
const APP_NAME = "MJ.TALK";

export const metadata = {
  title: "Terms of Service — MJ.TALK",
  description: "The terms that govern your use of the MJ.TALK platform.",
};

export default function TermsPage() {
  return (
    <LegalShell activeLink="Terms">
      <LegalHeader
        updated={LAST_UPDATED}
        title="Terms of Service"
        intro={`These Terms of Service ("Terms") govern your access to and use of ${APP_NAME}. By creating an account or using our service you agree to be bound by these Terms. Please read them carefully.`}
      />

      <LegalSection title="1. The Service">
        <p>{APP_NAME} provides a live-chat and AI support platform that lets you deploy chat widgets on your websites, manage conversations in a shared inbox, and configure AI chatbots. We offer a free tier and paid plans as described on our pricing page.</p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>You must be at least 18 years old to create an account. By using the service you represent that all information you provide is accurate and that you have authority to bind any organisation on whose behalf you use the service.</p>
      </LegalSection>

      <LegalSection title="3. Account Responsibilities">
        <LegalList items={[
          "You are responsible for maintaining the confidentiality of your account credentials.",
          "You must notify us immediately at <a href='mailto:" + SUPPORT_EMAIL + "' style='color:#0d8585'>" + SUPPORT_EMAIL + "</a> if you suspect unauthorised access.",
          "You are responsible for all activity that occurs under your account.",
          "You may not share login credentials with individuals outside your organisation.",
        ]} />
      </LegalSection>

      <LegalSection title="4. Acceptable Use">
        <p>You agree not to use MJ.TALK to:</p>
        <LegalList items={[
          "Violate any applicable law or regulation.",
          "Transmit spam, malware, or unsolicited bulk messages.",
          "Collect personal data from minors without appropriate consent.",
          "Impersonate another person or organisation.",
          "Attempt to gain unauthorised access to our systems or another user&apos;s account.",
          "Resell or sublicense the service without our written permission.",
          "Use the service to build a competing product.",
        ]} />
        <p style={{ marginTop: "1rem" }}>We reserve the right to suspend or terminate accounts that violate these rules.</p>
      </LegalSection>

      <LegalSection title="5. Your Content">
        <p>You retain ownership of all conversation data, knowledge base articles, and other content you upload to MJ.TALK (&ldquo;Your Content&rdquo;). By using the service you grant us a limited licence to store, process, and display Your Content solely to provide the service to you.</p>
        <p style={{ marginTop: "0.75rem" }}>You are responsible for ensuring Your Content does not infringe third-party intellectual-property rights or violate applicable privacy laws.</p>
      </LegalSection>

      <LegalSection title="6. Intellectual Property">
        <p>The MJ.TALK name, logo, software, and all associated documentation are owned by us or our licensors. Nothing in these Terms transfers any intellectual-property rights to you beyond the limited right to use the service.</p>
      </LegalSection>

      <LegalSection title="7. Payment and Plans">
        <LegalList items={[
          "Free plan: available with no payment required.",
          "Paid plans: billed monthly or annually as selected. Payment is processed by Stripe.",
          "Refunds: you may request a refund within 14 days of a charge if you have not made substantial use of paid features.",
          "We may change plan pricing with 30 days&apos; notice. Your rate is locked until your next renewal after the notice period.",
          "Non-payment may result in downgrade to the free tier.",
        ]} />
      </LegalSection>

      <LegalSection title="8. Uptime and Support">
        <p>We aim for high availability but do not provide a formal SLA on free or standard paid plans. Enterprise plans include a written SLA. We provide support via <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0d8585" }}>{SUPPORT_EMAIL}</a> with a target response time of one business day.</p>
      </LegalSection>

      <LegalSection title="9. Disclaimer of Warranties">
        <p>The service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or meet your specific requirements. AI-generated responses may be inaccurate; you are responsible for reviewing them before acting on them.</p>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <p>To the maximum extent permitted by law, MJ.TALK&apos;s total liability to you for any claim arising out of or relating to these Terms or the service shall not exceed the amount you paid us in the 12 months preceding the claim, or USD 100, whichever is greater. We are not liable for indirect, incidental, consequential, or punitive damages.</p>
      </LegalSection>

      <LegalSection title="11. Indemnification">
        <p>You agree to indemnify and hold harmless MJ.TALK and its team from any claims, damages, or expenses (including legal fees) arising out of your use of the service, Your Content, or your violation of these Terms.</p>
      </LegalSection>

      <LegalSection title="12. Termination">
        <p>You may delete your account at any time from Dashboard → Settings → Delete Account. We may terminate or suspend your access immediately for material breach of these Terms. On termination, your right to use the service ceases and we will delete your data per our <Link href="/privacy" style={{ color: "#0d8585" }}>Privacy Policy</Link>.</p>
      </LegalSection>

      <LegalSection title="13. Governing Law">
        <p>These Terms are governed by the laws of the jurisdiction in which MJ.TALK is registered, without regard to conflict-of-law principles. Disputes shall be resolved by binding arbitration or in the courts of that jurisdiction.</p>
      </LegalSection>

      <LegalSection title="14. Changes to These Terms">
        <p>We may revise these Terms at any time. For material changes we will provide at least 14 days&apos; notice via email or in-dashboard banner. Continued use after the effective date constitutes acceptance.</p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>Questions about these Terms: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0d8585" }}>{SUPPORT_EMAIL}</a></p>
      </LegalSection>
    </LegalShell>
  );
}

/* ── Shared legal layout components ── */
function LegalShell({ children, activeLink }: { children: React.ReactNode; activeLink: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif", color: "#0a1628" }}>
      <nav style={{ padding: "1.25rem 2rem", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0a7070", textDecoration: "none", letterSpacing: "-0.04em" }}>
          MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
        </Link>
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem" }}>
          {[{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Cookies", href: "/cookies" }, { label: "Contact", href: "/contact" }].map(({ label, href }) => (
            <Link key={label} href={href} style={{
              color: label === activeLink ? "#0d8585" : "#5a7878",
              textDecoration: "none",
              fontWeight: label === activeLink ? 600 : 400,
            }}>{label}</Link>
          ))}
        </div>
      </nav>
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 2rem 5rem" }}>
        {children}
      </main>
      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "1.5rem 2rem", textAlign: "center", fontSize: "0.8rem", color: "#9ca3af" }}>
        © {new Date().getFullYear()} MJ.TALK ·{" "}
        <Link href="/privacy" style={{ color: "#9ca3af" }}>Privacy</Link> ·{" "}
        <Link href="/terms" style={{ color: "#9ca3af" }}>Terms</Link> ·{" "}
        <Link href="/cookies" style={{ color: "#9ca3af" }}>Cookies</Link>
      </footer>
    </div>
  );
}

function LegalHeader({ updated, title, intro }: { updated: string; title: string; intro: string }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <p style={{ fontSize: "0.8rem", color: "#5a7878", marginBottom: "0.5rem" }}>Last updated: {updated}</p>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>{title}</h1>
      <p style={{ color: "#5a7878", lineHeight: 1.7 }}>{intro}</p>
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
