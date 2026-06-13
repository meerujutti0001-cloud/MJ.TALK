import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { TeamManagement } from "@/components/dashboard/team-management";

export default async function TeamPage() {
  const user = await requireAuth();
  const supabase = createServiceClient();

  let orgId: string | null = null;
  let orgName = "";
  let isOwner = false;

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownedOrg) {
    orgId = ownedOrg.id;
    orgName = ownedOrg.name;
    isOwner = true;
  } else {
    const resolvedOrgId = await getOrgId(user.id);
    if (resolvedOrgId) {
      orgId = resolvedOrgId;
      const { data: memberOrg } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", resolvedOrgId)
        .maybeSingle();
      orgName = memberOrg?.name ?? "";
    }
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
