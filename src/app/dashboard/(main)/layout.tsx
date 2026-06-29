import type { ReactNode } from "react";
import { requireAuth, getUserRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FloatingWidget } from "@/components/floating-widget";
import { RealtimeNotificationProvider } from "@/components/dashboard/realtime-notification-provider";
import type { UserRole } from "@/types";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();
  const serviceClient = createServiceClient();

  // ── Parallel: fetch owned org AND agent membership at the same time ──
  const [ownedOrgResult, membershipResult] = await Promise.all([
    serviceClient
      .from("organizations")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    serviceClient
      .from("team_members")
      .select("org_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .maybeSingle(),
  ]);

  let org: { id: string; name: string } | null = ownedOrgResult.data ?? null;

  // If not an owner, look up the org from team membership
  if (!org && membershipResult.data?.org_id) {
    const { data: memberOrg } = await serviceClient
      .from("organizations")
      .select("id, name")
      .eq("id", membershipResult.data.org_id)
      .maybeSingle();
    org = memberOrg ?? null;
  }

  if (!org) redirect("/dashboard/setup");

  // ── Parallel: role, chatbot, unread count — all at once ──
  const isOwnerByQuery = !!ownedOrgResult.data;

  const [roleResult, chatbotResult, unreadResult] = await Promise.all([
    // Role: use email directly — skip the expensive auth.admin.getUserById call
    isOwnerByQuery
      ? Promise.resolve(
          user.email === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? "meerujutti0.001@gmail.com")
            ? "super_admin" as UserRole
            : "owner" as UserRole
        )
      : getUserRole(user.id, org!.id, user.email ?? ""),

    // First active chatbot for floating widget
    serviceClient
      .from("chatbots")
      .select("id")
      .eq("org_id", org!.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),

    // Unread notification count
    serviceClient
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org!.id)
      .eq("read", false),
  ]);

  const role = roleResult;
  const unreadCount = unreadResult.count ?? 0;

  return (
    <RealtimeNotificationProvider orgId={org!.id} initialUnreadCount={unreadCount}>
      <DashboardShell user={user} org={org!} unreadCount={unreadCount} role={role}>
        {children}
        {chatbotResult.data?.id && <FloatingWidget chatbotId={chatbotResult.data.id} />}
      </DashboardShell>
    </RealtimeNotificationProvider>
  );
}
