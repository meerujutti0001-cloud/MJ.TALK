"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";

export default function SignupPage() {
  const [orgName, setOrgName]                 = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [verifyPending, setVerifyPending]     = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const res  = await fetch("/api/auth/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password, orgName }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create account");
      setLoading(false);
      return;
    }

    // Account created — user must verify their email before signing in
    setVerifyPending(true);
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.9rem",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box",
  };

  /* ── Email verification pending screen ── */
  if (verifyPending) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #122157 100%)",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 60% at 30% 70%, rgba(29,191,160,0.08) 0%, transparent 60%)" }} />

        <div style={{ width: "100%", maxWidth: "420px", position: "relative", textAlign: "center" }}>
          {/* Logo */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "#fff", letterSpacing: "-0.02em" }}>
              MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "16px", padding: "2.5rem 2rem", backdropFilter: "blur(12px)",
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "rgba(29,191,160,0.15)", border: "1px solid rgba(29,191,160,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}>
              <Mail size={28} color="#1dbfa0" />
            </div>

            <h2 style={{ fontWeight: 700, fontSize: "1.35rem", color: "#fff", marginBottom: "0.75rem" }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: "0.5rem" }}>
              We sent a verification link to
            </p>
            <p style={{ fontSize: "0.95rem", color: "#1dbfa0", fontWeight: 600, marginBottom: "1.5rem", wordBreak: "break-all" }}>
              {email}
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: "2rem" }}>
              Click the link in the email to confirm your account. Check your spam folder if you don&apos;t see it within a few minutes.
            </p>

            <Link href="/login" style={{
              display: "block", width: "100%", padding: "0.75rem",
              background: "#0d8585", color: "#fff", fontWeight: 700,
              fontSize: "0.9rem", borderRadius: "8px", textDecoration: "none",
              textAlign: "center",
            }}>
              Go to Sign In
            </Link>

            {/* Contact support */}
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", marginTop: "1.5rem" }}>
              Having trouble?{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Signup%20issue%20-%20${encodeURIComponent(email)}`}
                style={{ color: "#1dbfa0", textDecoration: "none", fontWeight: 500 }}
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Signup form ── */
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #122157 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 60% at 30% 70%, rgba(29,191,160,0.08) 0%, transparent 60%)" }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "#fff", letterSpacing: "-0.02em" }}>
            MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Create your free account</p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px", padding: "2rem", backdropFilter: "blur(12px)",
        }}>
          <h1 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Create account</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Set up your AI support platform</p>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.875rem", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { id: "orgName",         label: "Organization / Business Name", type: "text",     placeholder: "Acme Corp",         value: orgName,         onChange: setOrgName },
              { id: "email",           label: "Email",                        type: "email",    placeholder: "you@example.com",   value: email,           onChange: setEmail },
              { id: "password",        label: "Password",                     type: "password", placeholder: "••••••••",          value: password,        onChange: setPassword },
              { id: "confirmPassword", label: "Confirm Password",             type: "password", placeholder: "••••••••",          value: confirmPassword, onChange: setConfirmPassword },
            ].map(f => (
              <div key={f.id}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: "0.4rem" }}>{f.label}</label>
                <input
                  id={f.id} type={f.type} placeholder={f.placeholder}
                  value={f.value} onChange={e => f.onChange(e.target.value)} required
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#1dbfa0")}
                  onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "8px",
                background: loading ? "#0a7070" : "#0d8585",
                color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "background 0.2s", marginTop: "0.5rem",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#0a7070"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#0d8585"; }}
            >
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", marginTop: "1.5rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#1dbfa0", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>

          {/* Contact support */}
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginTop: "0.75rem" }}>
            Need help?{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Signup%20help`}
              style={{ color: "#1dbfa0", textDecoration: "none" }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  );
}
