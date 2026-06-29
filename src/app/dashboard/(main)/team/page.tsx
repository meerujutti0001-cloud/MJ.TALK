import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { TeamManagement } from "@/components/dashboard/team-management";

export default async function TeamPage() {
  const user = await requireAuth();
  const supabase = createServiceClient();

  // Parallel: owned org + agent membership
  const [ownedOrgResult, membershipResult] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("owner_id", user.id).maybeSingle(),
    supabase.from("team_members").select("org_id").eq("user_id", user.id).not("accepted_at", "is", null).maybeSingle(),
  ]);

  let orgId: string | null = null;
  let orgName = "";
  let isOwner = false;

  if (ownedOrgResult.data) {
    orgId = ownedOrgResult.data.id;
    orgName = ownedOrgResult.data.name;
    isOwner = true;
  } else if (membershipResult.data?.org_id) {
    orgId = membershipResult.data.org_id;
    // Fetch org name (needed for invite links)
    const { data: memberOrg } = await supabase
      .from("organizations").select("id, name").eq("id", orgId).maybeSingle();
    orgName = memberOrg?.name ?? "";
  }

  if (!orgId) redirect("/dashboard/setup");

  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .eq("org_id", orgId)
    .order("invited_at", { ascending: false });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          Team
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage team members and their access levels.
        </p>
      </div>
      <TeamManagement
        orgId={orgId}
        orgName={orgName}
        members={members ?? []}
        isOwner={isOwner}
      />
    </div>
  );
}
