import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Debug endpoint — remove before going to production
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, error: error?.message });
  }

  const serviceClient = createServiceClient();
  const { data: orgs } = await serviceClient
    .from("organizations")
    .select("id, name, owner_id")
    .eq("owner_id", user.id);

  const { data: memberships } = await serviceClient
    .from("team_members")
    .select("org_id, role, accepted_at")
    .eq("user_id", user.id);

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
    orgs: orgs ?? [],
    memberships: memberships ?? [],
  });
}
