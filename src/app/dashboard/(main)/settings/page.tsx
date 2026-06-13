import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  const serviceClient = createServiceClient();
  const { data: org } = await serviceClient
    .from("organizations")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!org) redirect("/dashboard/setup");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your workspace and account settings.</p>
      </div>
      <SettingsForm org={org} userEmail={user.email ?? ""} />
    </div>
  );
}
