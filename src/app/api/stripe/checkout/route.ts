import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe, PLANS, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    // Check Stripe is configured before doing anything
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "stripe_not_configured",
          message: "Online payment is not yet enabled. Please contact support to upgrade your plan.",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to purchase a plan" }, { status: 401 });
    }

    const body = await req.json();
    const { plan, billingCycle } = body as { plan: "premium"; billingCycle: "monthly" | "yearly" };

    if (plan !== "premium") {
      return NextResponse.json({ error: "Only the Premium plan uses Stripe checkout" }, { status: 400 });
    }

    const planConfig = PLANS.premium;
    if (!planConfig.priceId) {
      return NextResponse.json(
        {
          error: "stripe_not_configured",
          message: "Payment is not fully configured yet. Please contact support to complete your upgrade.",
        },
        { status: 503 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";
    const service = createServiceClient();
    const stripe = getStripe();

    // Get org — gracefully handle if stripe columns don't exist yet
    let org: { id: string; name: string; stripe_customer_id?: string | null } | null = null;
    try {
      const { data } = await service
        .from("organizations")
        .select("id, name, stripe_customer_id")
        .eq("owner_id", user.id)
        .maybeSingle();
      org = data;
    } catch {
      // stripe_customer_id column may not exist yet — fetch without it
      const { data } = await service
        .from("organizations")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();
      org = data;
    }

    let customerId: string | undefined = org?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: org?.name ?? user.email!,
        metadata: { user_id: user.id, org_id: org?.id ?? "" },
      });
      customerId = customer.id;
      if (org?.id) {
        // Best-effort — column may not exist yet if migration 006 hasn't run
        try {
          await service.from("organizations").update({ stripe_customer_id: customerId }).eq("id", org.id);
        } catch { /* ignore if column missing */ }
      }
    }

    const priceId =
      billingCycle === "yearly" && process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
        ? process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
        : planConfig.priceId;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/purchase/confirmation?session_id={CHECKOUT_SESSION_ID}&plan=premium`,
      cancel_url: `${appUrl}/purchase/premium?cancelled=1`,
      metadata: {
        user_id: user.id,
        org_id: org?.id ?? "",
        plan: "premium",
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: { user_id: user.id, org_id: org?.id ?? "", plan: "premium" },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";

    // Surface specific Stripe errors clearly
    if (message.includes("No such price")) {
      return NextResponse.json(
        { error: "Invalid Stripe Price ID. Check STRIPE_PREMIUM_PRICE_ID in your Vercel environment variables." },
        { status: 500 }
      );
    }
    if (message.includes("column") && message.includes("does not exist")) {
      return NextResponse.json(
        { error: "Database migration required. Run supabase/migrations/006_stripe_billing.sql in your Supabase SQL Editor." },
        { status: 500 }
      );
    }
    if (message.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        { error: "Stripe secret key is not configured. Add STRIPE_SECRET_KEY to Vercel environment variables." },
        { status: 500 }
      );
    }
    if (message.includes("Invalid API Key") || message.includes("No such api")) {
      return NextResponse.json(
        { error: "Stripe API key is invalid. Check STRIPE_SECRET_KEY in your Vercel environment variables." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
