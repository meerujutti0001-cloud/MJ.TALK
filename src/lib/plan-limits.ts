/**
 * Plan limits and enforcement helpers.
 * Used server-side in API routes to gate features.
 */
import { createServiceClient } from "@/lib/supabase/server";

export const LIMITS = {
  starter: {
    chatsPerMonth: 500,
    agentSeats: 1,
    aiRepliesPerMonth: 0,
    chatbots: 1,
  },
  premium: {
    chatsPerMonth: -1,       // unlimited
    agentSeats: -1,
    aiRepliesPerMonth: 1000,
    chatbots: -1,
  },
  enterprise: {
    chatsPerMonth: -1,
    agentSeats: -1,
    aiRepliesPerMonth: -1,
    chatbots: -1,
  },
} as const;

export type PlanTier = keyof typeof LIMITS;

/** Get the org's current plan tier, checking expiry for premium */
export async function getOrgPlan(orgId: string): Promise<PlanTier> {
  const service = createServiceClient();
  const { data: org } = await service
    .from("organizations")
    .select("plan, plan_expires_at")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) return "starter";

  const plan = (org.plan ?? "starter") as PlanTier;

  if (plan === "premium") {
    // Check expiry — grace period of 3 days after expiry
    if (org.plan_expires_at) {
      const expires = new Date(org.plan_expires_at);
      const grace = new Date(expires.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (new Date() > grace) return "starter";
    }
  }

  return plan;
}

/** Count conversations created this calendar month for the org */
export async function getMonthlyChatsUsed(orgId: string): Promise<number> {
  const service = createServiceClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await service
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart)
    .in(
      "chatbot_id",
      service
        .from("chatbots")
        .select("id")
        .eq("org_id", orgId)
        .then() as unknown as string[]  // subquery
    );

  return count ?? 0;
}

/**
 * Check if org can create a new conversation.
 * Returns { allowed: true } or { allowed: false, reason, limit, used }
 */
export async function canCreateConversation(orgId: string): Promise<
  | { allowed: true }
  | { allowed: false; reason: string; limit: number; used: number }
> {
  const plan = await getOrgPlan(orgId);
  const limit = LIMITS[plan].chatsPerMonth;

  if (limit === -1) return { allowed: true }; // unlimited

  const service = createServiceClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Count conversations this month for ALL chatbots in this org
  const { data: chatbotIds } = await service
    .from("chatbots")
    .select("id")
    .eq("org_id", orgId);

  if (!chatbotIds || chatbotIds.length === 0) return { allowed: true };

  const ids = chatbotIds.map((c: { id: string }) => c.id);

  const { count } = await service
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .in("chatbot_id", ids)
    .gte("created_at", monthStart);

  const used = count ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Free plan limit reached: ${limit} chats/month. Upgrade to Premium for unlimited chats.`,
      limit,
      used,
    };
  }

  return { allowed: true };
}

/** Count accepted team members for an org */
export async function getAgentSeatCount(orgId: string): Promise<number> {
  const service = createServiceClient();
  const { count } = await service
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .not("accepted_at", "is", null);
  return count ?? 0;
}

/** Check if org can add another agent seat */
export async function canAddAgent(orgId: string): Promise<
  | { allowed: true }
  | { allowed: false; reason: string }
> {
  const plan = await getOrgPlan(orgId);
  const limit = LIMITS[plan].agentSeats;
  if (limit === -1) return { allowed: true };

  const current = await getAgentSeatCount(orgId);
  if (current >= limit) {
    return {
      allowed: false,
      reason: `Free plan allows ${limit} agent seat. Upgrade to Premium for unlimited agent seats.`,
    };
  }
  return { allowed: true };
}
