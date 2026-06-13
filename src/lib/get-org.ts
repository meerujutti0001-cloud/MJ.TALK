import { createServiceClient } from "@/lib/supabase/server";

/**
 * Gets the org ID for a given user using the service role client (bypasses RLS).
 * Use this in server components / API routes where the anon client might fail.
 */
export async function getOrgId(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  // Check ownership first
  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (ownedOrg) return ownedOrg.id;

  // Check team membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("org_id")
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .maybeSingle();

  return membership?.org_id ?? null;
}
