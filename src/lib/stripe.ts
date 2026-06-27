import Stripe from "stripe";

/* ─── Lazy Stripe client ──────────────────────────────────
   Don't throw at module load time — throw only when actually
   used, so the build succeeds even without the key set.
─────────────────────────────────────────────────────────── */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. " +
      "Add it to your Vercel environment variables and redeploy."
    );
  }
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia", typescript: true });
  return _stripe;
}

// Keep named export for backwards compat — lazily resolved
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/* ─── Plan config ─────────────────────────────────────── */
export const PLANS = {
  starter: {
    name: "Starter",
    price: 0,
    priceId: null,
    chatLimit: 500,
    agentLimit: 1,
    aiReplies: 0,
    features: ["500 chats/month", "1 agent seat", "Basic analytics"],
  },
  premium: {
    name: "Growth (Premium)",
    price: 29,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    chatLimit: -1,
    agentLimit: -1,
    aiReplies: 1000,
    features: ["Unlimited chats", "Unlimited agents", "1,000 AI replies/mo", "Priority support"],
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    priceId: null,
    chatLimit: -1,
    agentLimit: -1,
    aiReplies: -1,
    features: ["Everything in Growth", "Unlimited AI replies", "White-label", "SLA", "Dedicated manager"],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanById(id: string): PlanId {
  if (id in PLANS) return id as PlanId;
  return "starter";
}

/** Returns true if Stripe is configured in this environment */
export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PREMIUM_PRICE_ID);
}
