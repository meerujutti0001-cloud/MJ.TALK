import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? "meerujutti0.001@gmail.com";

export type UserRole = "super_admin" | "owner" | "agent" | "guest";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Resolve the effective role for the current user.
 * Uses the user object directly (email already available — no extra admin API call).
 * Parallelizes org ownership + membership checks.
 */
export async function getUserRole(
  userId: string,
  orgId?: string,
  userEmail?: string   // pass this to avoid an extra auth.admin call
): Promise<UserRole> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  // Super admin check — use email from the user object if provided
  const email = userEmail ?? "";
  if (email && email === SUPER_ADMIN_EMAIL) return "super_admin";

  // If email wasn't passed and we need to verify super admin, skip the expensive
  // auth.admin.getUserById and just check the env var directly against what we have.
  // The caller should pass userEmail to avoid this fallback.

  if (!orgId) {
    // Parallel check for any org relationship
    const [ownedResult, memberResult] = await Promise.all([
      supabase.from("organizations").select("id").eq("owner_id", userId).maybeSingle(),
      supabase.from("team_members").select("org_id").eq("user_id", userId)
        .not("accepted_at", "is", null).maybeSingle(),
    ]);
    if (ownedResult.data) return "owner";
    if (memberResult.data) return "agent";
    return "guest";
  }

  // Parallel check for this specific org
  const [ownedResult, memberResult] = await Promise.all([
    supabase.from("organizations").select("id").eq("id", orgId).eq("owner_id", userId).maybeSingle(),
    supabase.from("team_members").select("org_id").eq("org_id", orgId).eq("user_id", userId)
      .not("accepted_at", "is", null).maybeSingle(),
  ]);

  if (ownedResult.data) return "owner";
  if (memberResult.data) return "agent";
  return "guest";
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
  if (!org) redirect("/dashboard/setup");
  return { user, org };
}

export async function requireOwnerOrAbove(orgId: string) {
  const user = await requireAuth();
  const role = await getUserRole(user.id, orgId, user.email ?? "");
  if (role === "agent" || role === "guest") redirect("/dashboard?error=forbidden");
  return { user, role };
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  const role = await getUserRole(user.id, undefined, user.email ?? "");
  if (role !== "super_admin") redirect("/dashboard?error=forbidden");
  return { user, role };
}
