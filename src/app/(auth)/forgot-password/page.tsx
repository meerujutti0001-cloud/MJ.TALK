"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Use server-side admin API to generate reset link directly
    // (bypasses Supabase's broken SMTP on free tier)
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to generate reset link");
      setLoading(false);
      return;
    }

    // Redirect user directly to the reset link (no email needed)
    if (data.actionLink) {
      window.location.href = data.actionLink;
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #122157 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 60% at 30% 70%, rgba(29,191,160,0.08) 0%, transparent 60%)" }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em", fontWeight: 800, fontSize: "1.8rem", color: "#fff" }}>
            MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "2rem", backdropFilter: "blur(12px)" }}>
          <h1 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Reset password</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Enter your email and we&apos;ll send a reset link.</p>

          {sent ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem 0", textAlign: "center" }}>
              <CheckCircle size={48} color="#1dbfa0" />
              <p style={{ color: "#fff", fontWeight: 600 }}>Check your email</p>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
                We sent a reset link to <span style={{ color: "#1dbfa0" }}>{email}</span>. Check your inbox and follow the link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.875rem", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                  {error}
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: "0.4rem" }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "0.65rem 0.9rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "#1dbfa0")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "0.75rem", borderRadius: "8px",
                background: loading ? "#0a7070" : "#0d8585", color: "#fff",
                fontWeight: 700, fontSize: "0.95rem", border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "background 0.2s",
              }}>
                {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1dbfa0")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  );
}

