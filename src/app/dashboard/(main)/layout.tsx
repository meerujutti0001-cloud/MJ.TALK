import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();

  // Use service client — bypasses RLS entirely so org lookup always works
  const serviceClient = createServiceClient();

  let org: { id: string; name: string } | null = null;

  // 1. Check if user owns an org
  const { data: ownedOrg } = await serviceClient
    .from("organizations")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (ownedOrg) {
    org = ownedOrg;
  } else {
    // 2. Check team membership (accepted invites)
    const { data: membership } = await serviceClient
      .from("team_members")
      .select("org_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .maybeSingle();

    if (membership?.org_id) {
      const { data: memberOrg } = await serviceClient
        .from("organizations")
        .select("id, name")
        .eq("id", membership.org_id)
        .maybeSingle();
      org = memberOrg ?? null;
    }
  }

  if (!org) {
    redirect("/dashboard/setup");
  }

  // Notification count (anon client, scoped by RLS to this user's orgs)
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org!.id)
    .eq("read", false);

  return (
    <DashboardShell user={user} org={org!} unreadCount={unreadCount ?? 0}>
      {children}
    </DashboardShell>
  );
}
