import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  try {
    // Authenticate the caller
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await req.json();
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const service = createServiceClient();

    // Look up the team member to get their org
    const { data: member } = await service
      .from("team_members")
      .select("id, org_id, role, user_id")
      .eq("id", memberId)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify caller owns the org
    const { data: org } = await service
      .from("organizations")
      .select("id")
      .eq("id", member.org_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: "Only the workspace owner can remove members" }, { status: 403 });
    }

    // Cannot remove the owner row
    if (member.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
    }

    const { error } = await service
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("[team/remove] delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[team/remove] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
