import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
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
        { error: "Stripe price ID is not configured. Add STRIPE_PREMIUM_PRICE_ID to your environment variables." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";
    const service = createServiceClient();

    // Get or create Stripe customer for this user
    const { data: org } = await service
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    let customerId: string | undefined = org?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: org?.name ?? user.email!,
        metadata: {
          user_id: user.id,
          org_id: org?.id ?? "",
        },
      });
      customerId = customer.id;

      // Save customer ID to org
      if (org?.id) {
        await service
          .from("organizations")
          .update({ stripe_customer_id: customerId })
          .eq("id", org.id);
      }
    }

    // Determine price ID based on billing cycle
    // For yearly we apply a coupon / use a separate yearly price if set
    const priceId =
      billingCycle === "yearly" && process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
        ? process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
        : planConfig.priceId;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/purchase/confirmation?session_id={CHECKOUT_SESSION_ID}&plan=premium`,
      cancel_url: `${appUrl}/purchase/premium?cancelled=1`,
      metadata: {
        user_id: user.id,
        org_id: org?.id ?? "",
        plan: "premium",
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          org_id: org?.id ?? "",
          plan: "premium",
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
