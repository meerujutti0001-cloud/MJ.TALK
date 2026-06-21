import Link from "next/link";

const LAST_UPDATED = "June 2026";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";
const APP_NAME = "MJ.TALK";

export const metadata = {
  title: "Cookie Policy — MJ.TALK",
  description: "How MJ.TALK uses cookies and similar tracking technologies.",
};

export default function CookiesPage() {
  return (
    <LegalShell activeLink="Cookies">
      <LegalHeader
        updated={LAST_UPDATED}
        title="Cookie Policy"
        intro={`This policy explains how ${APP_NAME} uses cookies and similar technologies when you visit our website or use our service. By continuing to use ${APP_NAME} you agree to our use of cookies as described below.`}
      />

      <LegalSection title="1. What Are Cookies">
        <p>
          Cookies are small text files that a website stores on your browser or device when you visit. They help the
          site remember information about your visit, making it work better and more securely on your next visit.
          Similar technologies include local storage, session storage, and pixel tags — where we say &ldquo;cookies&rdquo;
          in this policy we mean all of these technologies.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies We Use">
        <p style={{ marginBottom: "1rem" }}>We use a small number of cookies, grouped by purpose:</p>

        <CookieTable
          rows={[
            {
              name: "sb-access-token / sb-refresh-token",
              purpose: "Strictly necessary — authentication",
              provider: "Supabase",
              duration: "Session / up to 1 hour (access); up to 30 days (refresh)",
            },
            {
              name: "sb-auth-token",
              purpose: "Strictly necessary — keeps you signed in",
              provider: "Supabase",
              duration: "Up to 30 days",
            },
            {
              name: "__Host-next-auth.csrf-token",
              purpose: "Strictly necessary — CSRF protection for form submissions",
              provider: "Next.js / internal",
              duration: "Session",
            },
            {
              name: "_vercel_jwt",
              purpose: "Strictly necessary — edge-network routing and security",
              provider: "Vercel",
              duration: "Session",
            },
            {
              name: "_mjtalk_analytics",
              purpose: "Analytics — aggregate, anonymised page-view counting (no cross-site tracking)",
              provider: "MJ.TALK (internal)",
              duration: "90 days",
            },
          ]}
        />

        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#5a7878" }}>
          We do <strong>not</strong> use advertising or social-media tracking cookies. We do <strong>not</strong> share
          cookie data with third-party advertisers.
        </p>
      </LegalSection>

      <LegalSection title="3. Strictly Necessary Cookies">
        <p>
          These cookies are essential to provide you with the service. Without them you cannot log in, your session
          cannot be maintained, and forms on the site would be vulnerable to CSRF attacks. Because they are strictly
          necessary, they do not require your consent under ePrivacy rules, but we disclose them here for full
          transparency.
        </p>
      </LegalSection>

      <LegalSection title="4. Analytics Cookies">
        <p>
          We use one internal analytics cookie (<code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: "4px", fontSize: "0.85em" }}>_mjtalk_analytics</code>)
          to count page views and understand which features are used most. The data is aggregated and anonymised —
          it cannot be used to identify individual users. We do not share this data with any third party.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          You can opt out of this cookie by declining analytics cookies in the banner shown on your first visit,
          or by clearing your cookies at any time.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies Set by Third-Party Services">
        <p>Some third-party services we integrate with may set their own cookies:</p>
        <LegalList items={[
          "<strong>Stripe</strong> — payment processing. Stripe may set cookies on the payment checkout page to prevent fraud. See <a href='https://stripe.com/cookies-policy/legal' target='_blank' rel='noopener noreferrer' style='color:#0d8585'>Stripe&apos;s Cookie Policy</a>.",
          "<strong>Vercel</strong> — hosting infrastructure. Vercel sets a session cookie for edge-network security. See <a href='https://vercel.com/legal/privacy-policy' target='_blank' rel='noopener noreferrer' style='color:#0d8585'>Vercel&apos;s Privacy Policy</a>.",
        ]} />
        <p style={{ marginTop: "0.75rem" }}>
          We do not control these third-party cookies. Please review each provider&apos;s policy for details.
        </p>
      </LegalSection>

      <LegalSection title="6. How to Control Cookies">
        <p>You can manage or delete cookies in several ways:</p>
        <LegalList items={[
          "<strong>Browser settings</strong> — every modern browser lets you view, block, or delete cookies. Look for &ldquo;Privacy&rdquo; or &ldquo;Security&rdquo; in your browser settings.",
          "<strong>Opt-out banner</strong> — on your first visit to our site a cookie banner lets you accept or decline non-essential cookies.",
          "<strong>Private/Incognito mode</strong> — cookies set during a private session are deleted when you close the window.",
        ]} />
        <p style={{ marginTop: "0.75rem" }}>
          Note: blocking strictly necessary cookies will prevent you from logging in or using core features of the
          dashboard.
        </p>
      </LegalSection>

      <LegalSection title="7. Do Not Track">
        <p>
          Some browsers include a &ldquo;Do Not Track&rdquo; (DNT) signal. We honour DNT by not loading our analytics
          cookie when DNT is enabled. Strictly necessary cookies are still set regardless of DNT status.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to This Policy">
        <p>
          We may update this Cookie Policy as our use of cookies changes or when required by law. The date at the top
          of this page shows the most recent revision. Material changes will be communicated via in-dashboard notice
          or email.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          Questions about cookies or this policy:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0d8585" }}>{SUPPORT_EMAIL}</a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}

/* ── Cookie table ── */
interface CookieRow {
  name: string;
  purpose: string;
  provider: string;
  duration: string;
}

function CookieTable({ rows }: { rows: CookieRow[] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
      <table style={{
        width: "100%", borderCollapse: "collapse",
        fontSize: "0.82rem", color: "#374151",
      }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {["Name", "Purpose", "Provider", "Duration"].map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "0.6rem 0.75rem",
                fontWeight: 600, color: "#0a1628",
                whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} style={{
              borderBottom: "1px solid #f3f4f6",
              background: i % 2 === 0 ? "#fff" : "#fafafa",
            }}>
              <td style={{ padding: "0.55rem 0.75rem" }}>
                <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: "4px", fontSize: "0.8em" }}>
                  {r.name}
                </code>
              </td>
              <td style={{ padding: "0.55rem 0.75rem", lineHeight: 1.5 }}>{r.purpose}</td>
              <td style={{ padding: "0.55rem 0.75rem", whiteSpace: "nowrap" }}>{r.provider}</td>
              <td style={{ padding: "0.55rem 0.75rem", lineHeight: 1.5 }}>{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Shared legal layout (same pattern as /privacy and /terms) ── */
function LegalShell({ children, activeLink }: { children: React.ReactNode; activeLink: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif", color: "#0a1628" }}>
      <nav style={{
        padding: "1.25rem 2rem", borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0a7070", textDecoration: "none", letterSpacing: "-0.04em" }}>
          MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
        </Link>
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem" }}>
          {[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms",   href: "/terms" },
            { label: "Cookies", href: "/cookies" },
            { label: "Contact", href: "/contact" },
          ].map(({ label, href }) => (
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

      <footer style={{
        borderTop: "1px solid #e5e7eb", padding: "1.5rem 2rem",
        textAlign: "center", fontSize: "0.8rem", color: "#9ca3af",
      }}>
        © {new Date().getFullYear()} {APP_NAME} ·{" "}
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
        <li
          key={i}
          style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.65 }}
          dangerouslySetInnerHTML={{ __html: item }}
        />
      ))}
    </ul>
  );
}
