import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getOrganization() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (org) return org;

  // Check if user is a team member
  const { data: membership } = await supabase
    .from("team_members")
    .select("org_id, organizations(*)")
    .eq("user_id", user.id)
    .single();

  if (membership) {
    return (membership as { org_id: string; organizations: unknown }).organizations;
  }

  return null;
}

export async function requireOrg() {
  const user = await requireAuth();
  const org = await getOrganization();

  if (!org) {
    redirect("/dashboard/setup");
  }

  return { user, org };
}
