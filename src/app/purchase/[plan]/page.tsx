"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Check, Loader2, ArrowLeft, ShieldCheck, Zap, Crown } from "lucide-react";
import { PurchaseForm } from "@/components/purchase/purchase-form";

/* ─── Plan config ─── */
const PLAN_DETAILS = {
  premium: {
    name: "Growth (Premium)",
    price: "$29",
    period: "/month",
    yearlyPrice: "$290",
    yearlyPeriod: "/year  (save $58)",
    badge: "Most Popular",
    badgeColor: "#0d8585",
    description: "For growing teams that need scale, AI replies, and unlimited chats.",
    features: [
      "Unlimited chats / month",
      "Unlimited agent seats",
      "AI chatbot — 1,000 replies / mo",
      "Visitor tracking",
      "Priority support",
      "Advanced analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    period: "tailored pricing",
    yearlyPrice: null,
    yearlyPeriod: null,
    badge: "Custom",
    badgeColor: "#6366f1",
    description: "Custom infrastructure, SLA, and dedicated support for high-volume teams.",
    features: [
      "Everything in Growth",
      "Unlimited AI replies",
      "White-label widget",
      "SLA guarantee",
      "Dedicated account manager",
      "SSO & advanced security",
    ],
  },
} as const;

/* ─── Premium checkout button ─── */
function PremiumCheckout({ plan }: { plan: "premium" }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const details = PLAN_DETAILS[plan];

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Billing cycle toggle */}
      <div style={{ background: "#f8fbfb", borderRadius: "12px", padding: "1.25rem", border: "1px solid #d4f4ee" }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5a7878", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>
          Billing Cycle
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {(["monthly", "yearly"] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              style={{
                flex: 1, padding: "0.65rem", borderRadius: "8px",
                cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                background: billingCycle === cycle ? "#0d8585" : "#fff",
                color: billingCycle === cycle ? "#fff" : "#5a7878",
                border: `1.5px solid ${billingCycle === cycle ? "#0d8585" : "#d4f4ee"}`,
                transition: "all 0.15s",
              }}
            >
              {cycle === "monthly"
                ? `Monthly — ${details.price}/mo`
                : `Yearly — ${details.yearlyPrice}/yr`}
              {cycle === "yearly" && (
                <span style={{ display: "block", fontSize: "0.72rem", opacity: 0.85, marginTop: "2px" }}>Save $58</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "#edfaf7", borderRadius: "8px", border: "1px solid #d4f4ee" }}>
        <ShieldCheck size={16} color="#0d8585" />
        <span style={{ fontSize: "0.8rem", color: "#2d4a4a" }}>
          Secure payment via <strong>Stripe</strong>. Your card details never touch our servers.
        </span>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          width: "100%", padding: "0.9rem", borderRadius: "10px", border: "none",
          background: loading ? "#8aa3a3" : "linear-gradient(135deg,#0d8585,#14a085)",
          color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          transition: "opacity 0.15s",
        }}
      >
        {loading ? (
          <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Redirecting to Stripe…</>
        ) : (
          <><Zap size={16} /> Subscribe — {billingCycle === "monthly" ? "$29/mo" : "$290/yr"}</>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Main page ─── */
function PurchaseContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";
  const plan = params.plan as "premium" | "enterprise";

  if (plan !== "premium" && plan !== "enterprise") {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Invalid plan. <Link href="/">Go home</Link></div>;
  }

  const details = PLAN_DETAILS[plan];

  const handleEnterpriseSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/enterprise/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      router.push(`/purchase/confirmation?id=${result.orderId}&plan=enterprise`);
    } else {
      throw new Error(result.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fbfb" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #d4f4ee", padding: "1rem 2.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0a7070", textDecoration: "none", letterSpacing: "-0.04em" }}>
            MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
          </Link>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "#5a7878", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      {cancelled && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "0.75rem 2.5rem", textAlign: "center", fontSize: "0.875rem", color: "#92400e" }}>
          Payment was cancelled. No charge was made. You can try again below.
        </div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: plan === "premium" ? "1fr 1fr" : "2fr 1fr", gap: "2rem", alignItems: "start" }}>

          {/* Left — Form or Checkout */}
          <div style={{ background: "#fff", borderRadius: "14px", padding: "2.5rem", border: "1px solid #d4f4ee", boxShadow: "0 2px 16px rgba(13,133,133,0.06)" }}>
            <div style={{ marginBottom: "2rem" }}>
              <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: details.badgeColor, background: `${details.badgeColor}18`, padding: "3px 10px", borderRadius: "999px", marginBottom: "0.75rem" }}>
                {details.badge}
              </span>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0a1628", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                {plan === "premium" ? "Subscribe to Growth" : "Request Enterprise Plan"}
              </h1>
              <p style={{ color: "#5a7878", fontSize: "0.9rem", lineHeight: 1.6 }}>{details.description}</p>
            </div>

            {plan === "premium" ? (
              <PremiumCheckout plan="premium" />
            ) : (
              <PurchaseForm
                plan="enterprise"
                onSubmit={handleEnterpriseSubmit}
                onBack={() => router.push("/")}
              />
            )}
          </div>

          {/* Right — Order summary */}
          <div style={{ background: "#fff", borderRadius: "14px", padding: "2rem", border: "1px solid #d4f4ee", position: "sticky", top: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {plan === "premium" ? <Zap size={18} color="#0d8585" /> : <Crown size={18} color="#6366f1" />}
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0a1628", margin: 0 }}>Plan Summary</h3>
            </div>

            <div style={{ background: "linear-gradient(135deg,#042e2e,#064f50)", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.4rem" }}>
                {details.name}
              </p>
              <p style={{ color: "#fff", fontSize: "2rem", fontWeight: 800, margin: "0 0 0.2rem", letterSpacing: "-0.03em" }}>
                {details.price}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", margin: 0 }}>{details.period}</p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {details.features.map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.83rem", color: "#2d4a4a" }}>
                  <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#edfaf7", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                    <Check size={9} color="#0d8585" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div style={{ fontSize: "0.75rem", color: "#8aa3a3", lineHeight: 1.6, borderTop: "1px solid #f0f0f0", paddingTop: "1rem" }}>
              {plan === "premium"
                ? "Cancel anytime. 14-day refund policy. Billed via Stripe."
                : "Custom pricing. Our team will contact you within 24 hours."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <PurchaseContent />
    </Suspense>
  );
}
