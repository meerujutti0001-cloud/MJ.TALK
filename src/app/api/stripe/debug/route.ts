import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Debug endpoint — shows Stripe config status WITHOUT exposing secrets.
 * Remove after troubleshooting.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const monthlyPriceId = process.env.STRIPE_PREMIUM_PRICE_ID ?? "";
  const yearlyPriceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? "";

  // Test Stripe connectivity and price validity
  let stripeStatus: string = "not_tested";
  let priceStatus: string = "not_tested";
  let priceType: string = "unknown";
  let errorDetail: string = "";

  if (secretKey) {
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

      // Test: list prices (verifies key works)
      await stripe.prices.list({ limit: 1 });
      stripeStatus = "connected";

      // Test: fetch the actual price
      if (monthlyPriceId) {
        try {
          const price = await stripe.prices.retrieve(monthlyPriceId);
          priceStatus = "found";
          priceType = price.type; // 'recurring' or 'one_time'
        } catch (e) {
          priceStatus = "not_found";
          errorDetail = e instanceof Error ? e.message : String(e);
        }
      }
    } catch (e) {
      stripeStatus = "connection_failed";
      errorDetail = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    config: {
      STRIPE_SECRET_KEY: secretKey ? `${secretKey.slice(0, 12)}...${secretKey.slice(-4)} (${secretKey.length} chars)` : "NOT SET",
      STRIPE_WEBHOOK_SECRET: webhookSecret ? `${webhookSecret.slice(0, 10)}...${webhookSecret.slice(-4)}` : "NOT SET",
      STRIPE_PREMIUM_PRICE_ID: monthlyPriceId || "NOT SET",
      STRIPE_PREMIUM_YEARLY_PRICE_ID: yearlyPriceId || "NOT SET",
      keyMode: secretKey.startsWith("sk_test") ? "TEST MODE" : secretKey.startsWith("sk_live") ? "LIVE MODE" : "UNKNOWN",
    },
    stripe: {
      status: stripeStatus,
      priceStatus,
      priceType,
      error: errorDetail || null,
    },
    user: user ? user.email : "not_signed_in",
    note: "Delete this endpoint after troubleshooting",
  });
}
