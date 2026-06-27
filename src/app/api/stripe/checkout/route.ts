import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
    }

    const { billingCycle } = await req.json() as { billingCycle?: string };

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const monthlyPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    const yearlyPriceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;

    if (!secretKey) return NextResponse.json({ error: "STRIPE_SECRET_KEY not set in Vercel environment variables." }, { status: 503 });
    if (!monthlyPriceId) return NextResponse.json({ error: "STRIPE_PREMIUM_PRICE_ID not set in Vercel environment variables." }, { status: 503 });

    const priceId = billingCycle === "yearly" && yearlyPriceId ? yearlyPriceId : monthlyPriceId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/purchase/confirmation?session_id={CHECKOUT_SESSION_ID}&plan=premium`,
      cancel_url: `${appUrl}/purchase/premium?cancelled=1`,
      metadata: { user_id: user.id, plan: "premium" },
      subscription_data: { metadata: { user_id: user.id, plan: "premium" } },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL. Ensure price is a recurring subscription." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
