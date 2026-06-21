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

/**
 * Resolve the effective role for the current user within an org context.
 *
 * super_admin  — platform-level admin (hardcoded email, can also be set via env)
 * owner        — owns the organization
 * agent        — accepted team member of the org
 * guest        — authenticated but no org association
 */
export async function getUserRole(userId: string, orgId?: string): Promise<UserRole> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  // Get user email to check super admin
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email ?? "";

  if (email === SUPER_ADMIN_EMAIL) return "super_admin";

  if (!orgId) {
    // Try to find any org relationship
    const { data: owned } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (owned) return "owner";

    const { data: membership } = await supabase
      .from("team_members")
      .select("org_id")
      .eq("user_id", userId)
      .not("accepted_at", "is", null)
      .maybeSingle();
    if (membership) return "agent";

    return "guest";
  }

  // Check ownership for this specific org
  const { data: owned } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (owned) return "owner";

  // Check accepted team membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .maybeSingle();
  if (membership) return "agent";

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

/**
 * Require that the current user is at least an owner (or super_admin).
 * Agents are redirected to /dashboard with a forbidden message.
 */
export async function requireOwnerOrAbove(orgId: string) {
  const user = await requireAuth();
  const role = await getUserRole(user.id, orgId);
  if (role === "agent" || role === "guest") {
    redirect("/dashboard?error=forbidden");
  }
  return { user, role };
}

/**
 * Require super_admin. Redirects everyone else.
 */
export async function requireSuperAdmin() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);
  if (role !== "super_admin") {
    redirect("/dashboard?error=forbidden");
  }
  return { user, role };
}
