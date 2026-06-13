import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Verify session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[setup-org] Auth error:", authError?.message ?? "No user in session");
      return NextResponse.json(
        { error: `Not authenticated. Please sign in again. (${authError?.message ?? "no session"})` },
        { status: 401 }
      );
    }

    let body: { orgName?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { orgName } = body;
    if (!orgName?.trim()) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Check if org already exists — if so just return success
    const { data: existing } = await serviceClient
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existing) {
      console.log("[setup-org] Org already exists for user", user.id);
      return NextResponse.json({ success: true, orgId: existing.id });
    }

    // Create the org with service role (bypasses RLS)
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .insert({ name: orgName.trim(), owner_id: user.id })
      .select("id")
      .single();

    if (orgError) {
      console.error("[setup-org] Insert error:", orgError.message);
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    console.log("[setup-org] Created org", org.id, "for user", user.id);
    return NextResponse.json({ success: true, orgId: org.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[setup-org] Unexpected error:", msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
