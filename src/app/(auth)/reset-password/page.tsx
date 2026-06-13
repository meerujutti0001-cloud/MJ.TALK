"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [ready, setReady]                   = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.9rem",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
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
          <h1 style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Set new password</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Choose a strong password for your account.</p>

          {!ready ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2rem 0" }}>
              <Loader2 size={32} color="#1dbfa0" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>Verifying reset link...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.875rem", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                  {error}
                </div>
              )}
              {[
                { id: "password", label: "New Password", value: password, onChange: setPassword },
                { id: "confirmPassword", label: "Confirm Password", value: confirmPassword, onChange: setConfirmPassword },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: "0.4rem" }}>{f.label}</label>
                  <input
                    id={f.id} type="password" placeholder="••••••••"
                    value={f.value} onChange={e => f.onChange(e.target.value)} required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#1dbfa0")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                  />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "0.75rem", borderRadius: "8px",
                background: loading ? "#0a7070" : "#0d8585", color: "#fff",
                fontWeight: 700, fontSize: "0.95rem", border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "background 0.2s", marginTop: "0.5rem",
              }}>
                {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  );
}

