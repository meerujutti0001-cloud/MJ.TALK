"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { PurchaseForm } from "@/components/purchase/purchase-form";

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const plan = params.plan as "premium" | "enterprise";

  const planDetails = {
    premium: {
      name: "Growth (Premium)",
      price: "$29",
      period: "month",
      features: [
        "Unlimited chats",
        "Unlimited agent seats",
        "AI chatbot — 1,000 replies / mo",
        "Visitor tracking",
        "CRM integrations",
        "Priority support",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: "Custom",
      period: "tailored pricing",
      features: [
        "Everything in Growth",
        "Unlimited AI replies",
        "White-label widget",
        "SLA guarantee",
        "Dedicated account manager",
        "SSO & advanced security",
      ],
    },
  };

  const currentPlan = planDetails[plan];

  const handleSubmit = async (data: any) => {
    const response = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      router.push(`/purchase/confirmation?id=${result.orderId}&plan=${plan}`);
    } else {
      alert(result.message || "Something went wrong. Please try again.");
    }
  };

  if (!currentPlan) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fbfb" }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #d4f4ee",
        padding: "1rem 2.5rem",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Link href="/" style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "1.2rem",
            color: "#0a7070",
            textDecoration: "none",
          }}>
            MJ<span style={{ color: "#1dbfa0" }}>.</span>TALK
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
          {/* Main Form */}
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "2.5rem",
            border: "1px solid #d4f4ee",
          }}>
            <h1 style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#0a1628",
              marginBottom: "0.5rem",
            }}>
              {plan === "enterprise" ? "Request Enterprise Plan" : "Purchase Premium Plan"}
            </h1>
            <p style={{ fontSize: "0.9rem", color: "#5a7878", marginBottom: "2rem" }}>
              {plan === "enterprise" 
                ? "Please provide your details and our sales team will contact you within 24 hours."
                : "Complete your purchase in a few simple steps. Your subscription will be activated immediately."}
            </p>

            <PurchaseForm plan={plan} onSubmit={handleSubmit} onBack={() => router.push("/")} />
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "2rem",
              border: "1px solid #d4f4ee",
              position: "sticky",
              top: "2rem",
            }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0a1628", marginBottom: "1.5rem" }}>
                Order Summary
              </h3>

              <div style={{
                background: "#f8fbfb",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
              }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0a1628", marginBottom: "0.5rem" }}>
                  {currentPlan.name}
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0d8585", marginBottom: "0.25rem" }}>
                  {currentPlan.price}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#5a7878" }}>
                  {currentPlan.period}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0a1628", marginBottom: "0.75rem" }}>
                  Included Features:
                </h4>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {currentPlan.features.map((feature, i) => (
                    <li key={i} style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#2d4a4a" }}>
                      <span style={{
                        width: "16px", height: "16px", flexShrink: 0,
                        background: "#edfaf7", borderRadius: "50%",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={9} color="#0d8585" strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: "1rem", background: "#edfaf7", borderRadius: "8px", border: "1px solid #d4f4ee" }}>
                <div style={{ fontSize: "0.75rem", color: "#5a7878", lineHeight: 1.6 }}>
                  <strong>Secure Payment</strong><br />
                  Your information is protected with 256-bit SSL encryption
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
