import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "not_signed_in", message: "Please sign in before purchasing." },
        { status: 401 }
      );
    }

    // 2. Config check
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "stripe_not_configured", message: "Payment is not yet enabled. Contact support@mjtalk.com." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { plan, billingCycle } = body as { plan: string; billingCycle: "monthly" | "yearly" };

    if (plan !== "premium") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // 3. Resolve price ID
    const monthlyPriceId = process.env.STRIPE_PREMIUM_PRICE_ID ?? "";
    const yearlyPriceId  = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? "";
    const priceId = billingCycle === "yearly" && yearlyPriceId ? yearlyPriceId : monthlyPriceId;

    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_PREMIUM_PRICE_ID is not set in environment variables." },
        { status: 503 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";

    // 4. Import Stripe directly — avoid any proxy issues
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    // 5. Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/purchase/confirmation?session_id={CHECKOUT_SESSION_ID}&plan=premium`,
      cancel_url:  `${appUrl}/purchase/premium?cancelled=1`,
      metadata: { user_id: user.id, plan: "premium", billing_cycle: billingCycle },
      subscription_data: { metadata: { user_id: user.id, plan: "premium" } },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe returned no checkout URL. Verify the price ID is a recurring subscription price." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });

  } catch (err: unknown) {
    console.error("[stripe/checkout] FATAL:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
