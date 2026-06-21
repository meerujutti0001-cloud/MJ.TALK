import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

/* Next.js requires raw body for Stripe signature verification */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("[webhook] Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  const service = createServiceClient();

  try {
    switch (event.type) {

      /* ── Payment succeeded → activate plan ── */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const orgId = session.metadata?.org_id;
        const subscriptionId = session.subscription as string;

        if (!orgId) break;

        // Fetch subscription to get period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

        await service
          .from("organizations")
          .update({
            plan: "premium",
            plan_expires_at: expiresAt,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
          })
          .eq("id", orgId);

        console.log(`[webhook] Premium activated for org ${orgId} until ${expiresAt}`);
        break;
      }

      /* ── Subscription renewed ── */
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as { subscription?: string }).subscription;
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

        await service
          .from("organizations")
          .update({
            plan: "premium",
            plan_expires_at: expiresAt,
          })
          .eq("id", orgId);

        console.log(`[webhook] Subscription renewed for org ${orgId} until ${expiresAt}`);
        break;
      }

      /* ── Subscription cancelled / expired ── */
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        await service
          .from("organizations")
          .update({
            plan: "starter",
            plan_expires_at: null,
            stripe_subscription_id: null,
          })
          .eq("id", orgId);

        console.log(`[webhook] Subscription cancelled for org ${orgId} — downgraded to starter`);
        break;
      }

      /* ── Payment failed → notify but keep access for grace period ── */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[webhook] Payment failed for customer ${invoice.customer}`);
        // Stripe will retry — we don't revoke immediately
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
