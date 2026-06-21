import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, email, role } = await req.json();
    if (!orgId || !email) {
      return NextResponse.json({ error: "orgId and email are required" }, { status: 400 });
    }

    const service = createServiceClient();

    // Verify caller owns the org
    const { data: org } = await service
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: "Only the workspace owner can invite members" }, { status: 403 });
    }

    const { data: member, error } = await service
      .from("team_members")
      .insert({ org_id: orgId, email: email.trim(), role: role ?? "agent" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member });
  } catch (err) {
    console.error("[team/invite] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
