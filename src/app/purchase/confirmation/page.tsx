"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Mail, Phone } from "lucide-react";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const plan = searchParams.get("plan");

  const isEnterprise = plan === "enterprise";

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

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 2.5rem" }}>
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "3rem",
          border: "1px solid #d4f4ee",
          textAlign: "center",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: "#d1fae5",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
          }}>
            <CheckCircle size={48} color="#059669" />
          </div>

          <h1 style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "#0a1628",
            marginBottom: "1rem",
          }}>
            {isEnterprise ? "Request Submitted Successfully!" : "Thank You for Your Purchase!"}
          </h1>

          <p style={{
            fontSize: "1rem",
            color: "#5a7878",
            lineHeight: 1.7,
            marginBottom: "2rem",
            maxWidth: "500px",
            margin: "0 auto 2rem",
          }}>
            {isEnterprise 
              ? "We've received your Enterprise plan request. Our sales team will review your requirements and contact you within 24 hours."
              : "Your Premium subscription has been successfully processed. You can now access all premium features."}
          </p>

          <div style={{
            background: "#f8fbfb",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            textAlign: "left",
          }}>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#5a7878", marginBottom: "0.25rem" }}>
                Order ID
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#0a1628", fontFamily: "monospace" }}>
                {orderId}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #d4f4ee", paddingTop: "1rem" }}>
              <div style={{ fontSize: "0.875rem", color: "#5a7878", lineHeight: 1.6 }}>
                A confirmation email has been sent to your registered email address with all the details.
              </div>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "#edfaf7",
            borderRadius: "8px",
            border: "1px solid #d4f4ee",
          }}>
            <div style={{ textAlign: "center" }}>
              <Mail size={24} color="#0d8585" style={{ marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "0.875rem", color: "#5a7878", marginBottom: "0.25rem" }}>
                Email Support
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0a1628" }}>
                support@mjtalk.com
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Phone size={24} color="#0d8585" style={{ marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "0.875rem", color: "#5a7878", marginBottom: "0.25rem" }}>
                Phone Support
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0a1628" }}>
                +1 (555) 123-4567
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {!isEnterprise && (
              <Link
                href="/dashboard"
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: "8px",
                  background: "#0d8585",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Go to Dashboard
                <ArrowRight size={18} />
              </Link>
            )}
            <Link
              href="/contact"
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid #d4f4ee",
                color: "#0a1628",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
