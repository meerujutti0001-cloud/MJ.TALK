"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";

export default function SignupPage() {
  const [orgName, setOrgName]                 = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

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

    // Step 1 — create account + org via API
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

    // Step 2 — sign in immediately (account is pre-confirmed)
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Account was created, just couldn't auto-login — send to login page
      window.location.href = "/login";
      return;
    }

    // Step 3 — go to dashboard
    window.location.href = "/dashboard";
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.9rem",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box",
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
              { id: "orgName",         label: "Organization / Business Name", type: "text",     placeholder: "Acme Corp",       value: orgName,         onChange: setOrgName },
              { id: "email",           label: "Email",                        type: "email",    placeholder: "you@example.com", value: email,           onChange: setEmail },
              { id: "password",        label: "Password",                     type: "password", placeholder: "••••••••",        value: password,        onChange: setPassword },
              { id: "confirmPassword", label: "Confirm Password",             type: "password", placeholder: "••••••••",        value: confirmPassword, onChange: setConfirmPassword },
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

          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginTop: "0.75rem" }}>
            Need help?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Signup%20help`} style={{ color: "#1dbfa0", textDecoration: "none" }}>
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
