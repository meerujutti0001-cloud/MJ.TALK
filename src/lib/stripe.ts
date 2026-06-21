import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
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
    /** Set this in .env — your Stripe Price ID for the $29/mo product */
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    chatLimit: -1,        // unlimited
    agentLimit: -1,       // unlimited
    aiReplies: 1000,
    features: ["Unlimited chats", "Unlimited agents", "1,000 AI replies/mo", "Priority support"],
  },
  enterprise: {
    name: "Enterprise",
    price: null,          // custom pricing
    priceId: null,        // handled manually
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
