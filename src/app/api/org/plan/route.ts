import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { getOrgPlan, LIMITS, getMonthlyChatsUsed } from "@/lib/plan-limits";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getOrgId(user.id);
    if (!orgId) return NextResponse.json({ error: "No org" }, { status: 404 });

    const service = createServiceClient();
    const { data: org } = await service
      .from("organizations")
      .select("plan, plan_expires_at, stripe_subscription_id")
      .eq("id", orgId)
      .maybeSingle();

    const plan = await getOrgPlan(orgId);
    const limits = LIMITS[plan];
    const chatsUsed = limits.chatsPerMonth !== -1 ? await getMonthlyChatsUsed(orgId) : 0;

    return NextResponse.json({
      plan,
      planExpiresAt: org?.plan_expires_at ?? null,
      hasStripeSubscription: !!org?.stripe_subscription_id,
      limits,
      usage: {
        chatsThisMonth: chatsUsed,
        chatsLimit: limits.chatsPerMonth,
        chatsRemaining: limits.chatsPerMonth === -1 ? -1 : Math.max(0, limits.chatsPerMonth - chatsUsed),
      },
    });
  } catch (err) {
    console.error("[org/plan] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
