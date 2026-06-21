"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Mail, ArrowRight, Building2 } from "lucide-react";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId     = searchParams.get("id");
  const plan        = searchParams.get("plan");
  const sessionId   = searchParams.get("session_id"); // Stripe passes this
  const isEnterprise = plan === "enterprise";
  const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fbfb", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #d4f4ee", padding: "1rem 2.5rem" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0a7070", textDecoration: "none", letterSpacing: "-0.04em" }}>
          MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
        </Link>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "3rem", border: "1px solid #d4f4ee", boxShadow: "0 4px 24px rgba(13,133,133,0.08)", textAlign: "center" }}>

          {/* Icon */}
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: isEnterprise ? "#ede9fe" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.75rem" }}>
            {isEnterprise
              ? <Building2 size={40} color="#7c3aed" />
              : <CheckCircle2 size={40} color="#059669" />}
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0a1628", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
            {isEnterprise ? "Inquiry Received!" : "You're all set! 🎉"}
          </h1>

          <p style={{ color: "#5a7878", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem", maxWidth: "480px", margin: "0 auto 2rem" }}>
            {isEnterprise
              ? "Our sales team will review your requirements and reach out within 24 business hours to discuss custom pricing and a tailored demo."
              : `Your Premium subscription is now active. ${sessionId ? "Payment confirmed via Stripe." : ""} Head to your dashboard to start using all features.`}
          </p>

          {/* Order reference */}
          {orderId && (
            <div style={{ background: "#f8fbfb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.75rem", textAlign: "left" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 700, color: "#5a7878", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isEnterprise ? "Inquiry Reference" : "Order ID"}
              </p>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0a1628", fontFamily: "ui-monospace,monospace" }}>
                {orderId}
              </p>
              {!isEnterprise && (
                <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#8aa3a3" }}>
                  A receipt has been sent to your email by Stripe.
                </p>
              )}
            </div>
          )}

          {/* What happens next */}
          <div style={{ background: "#edfaf7", border: "1px solid #d4f4ee", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.75rem", textAlign: "left" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", fontWeight: 700, color: "#0a7070", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              What happens next
            </p>
            {isEnterprise ? (
              <ul style={{ margin: 0, padding: "0 0 0 1.1rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {[
                  "Our sales team reviews your requirements",
                  "You receive a custom pricing proposal within 24 hrs",
                  "We schedule a demo tailored to your use case",
                  "Your Enterprise plan is activated after agreement",
                ].map((s, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", color: "#2d4a4a", lineHeight: 1.5 }}>{s}</li>
                ))}
              </ul>
            ) : (
              <ul style={{ margin: 0, padding: "0 0 0 1.1rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {[
                  "Premium features are active on your account now",
                  "Stripe will send you a receipt by email",
                  "Subscription auto-renews — cancel anytime from Settings",
                  "Need help? Our support team is available 24/7",
                ].map((s, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", color: "#2d4a4a", lineHeight: 1.5 }}>{s}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Contact */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem", fontSize: "0.83rem", color: "#5a7878" }}>
            <Mail size={14} />
            <span>Questions? Email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0d8585", fontWeight: 600 }}>{SUPPORT_EMAIL}</a>
            </span>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            {!isEnterprise && (
              <Link href="/dashboard" style={{ padding: "0.75rem 1.75rem", borderRadius: "8px", background: "#0d8585", color: "#fff", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                Go to Dashboard <ArrowRight size={15} />
              </Link>
            )}
            <Link href="/contact" style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", background: "transparent", border: "1px solid #d4f4ee", color: "#0a1628", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
              Contact Support
            </Link>
            {isEnterprise && (
              <Link href="/signup" style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#edfaf7", color: "#0d8585", border: "1px solid #d4f4ee", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                Try free while we review
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
