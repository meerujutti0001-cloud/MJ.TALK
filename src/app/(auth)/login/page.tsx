"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = "/dashboard";
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #122157 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 60% at 30% 70%, rgba(29,191,160,0.08) 0%, transparent 60%)" }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em", fontWeight: 800, fontSize: "1.8rem", color: "#fff" }}>
            MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          padding: "2rem",
          backdropFilter: "blur(12px)",
        }}>
          <h1 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Welcome back</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Sign in to your account to continue</p>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.875rem", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "0.75rem", color: "#1dbfa0", textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: "100%", padding: "0.65rem 0.9rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "#1dbfa0")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>

            <button type="submit" disabled={loading} style={{
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", marginTop: "1.5rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "#1dbfa0", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
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

