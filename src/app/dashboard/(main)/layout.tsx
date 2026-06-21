import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FloatingWidget } from "@/components/floating-widget";
import { RealtimeNotificationProvider } from "@/components/dashboard/realtime-notification-provider";
import type { UserRole } from "@/types";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();
  const serviceClient = createServiceClient();

  let org: { id: string; name: string } | null = null;

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

  if (!org) redirect("/dashboard/setup");

  // Resolve the user's role for this org
  const role: UserRole = await getUserRole(user.id, org.id);

  // Fetch the org's first active chatbot to show as floating widget
  const { data: orgChatbot } = await serviceClient
    .from("chatbots")
    .select("id")
    .eq("org_id", org.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("read", false);

  return (
    <RealtimeNotificationProvider
      orgId={org.id}
      initialUnreadCount={unreadCount ?? 0}
    >
      <DashboardShell user={user} org={org} unreadCount={unreadCount ?? 0} role={role}>
        {children}
        {orgChatbot?.id && <FloatingWidget chatbotId={orgChatbot.id} />}
      </DashboardShell>
    </RealtimeNotificationProvider>
  );
}
