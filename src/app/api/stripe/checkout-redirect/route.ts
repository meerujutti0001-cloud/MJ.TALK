import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stripe/checkout-redirect?billing=monthly
 *
 * Server-side redirect to Stripe Checkout.
 * No client-side JS navigation needed — the browser follows the 302.
 */
export async function GET(req: NextRequest) {
  const billing = req.nextUrl.searchParams.get("billing") ?? "monthly";

  // Use the incoming request origin — works even if NEXT_PUBLIC_APP_URL is not set
  const origin = req.nextUrl.origin;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? origin).replace(/\/$/, "");

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login?next=/purchase/premium`);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const monthlyId = process.env.STRIPE_PREMIUM_PRICE_ID;
  const yearlyId  = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;

  if (!secretKey || !monthlyId) {
    return NextResponse.redirect(
      `${appUrl}/purchase/premium?error=${encodeURIComponent("Stripe is not yet configured. Contact support@mjtalk.com.")}`
    );
  }

  const priceId = billing === "yearly" && yearlyId ? yearlyId : monthlyId;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/purchase/confirmation?session_id={CHECKOUT_SESSION_ID}&plan=premium`,
      cancel_url:  `${appUrl}/purchase/premium?cancelled=1`,
      metadata: { user_id: user.id, plan: "premium" },
      subscription_data: { metadata: { user_id: user.id, plan: "premium" } },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.redirect(
        `${appUrl}/purchase/premium?error=${encodeURIComponent("Stripe returned no checkout URL.")}`
      );
    }

    // 302 redirect directly to Stripe — browser follows it natively
    return NextResponse.redirect(session.url);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout-redirect]", msg);
    return NextResponse.redirect(
      `${appUrl}/purchase/premium?error=${encodeURIComponent(msg)}`
    );
  }
}
