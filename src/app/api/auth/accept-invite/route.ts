import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, inviteId } = await req.json();

    if (!email || !password || !inviteId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify invite exists and matches email
    const { data: invite, error: inviteError } = await supabase
      .from("team_members")
      .select("id, email, org_id, accepted_at")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Email does not match invitation" }, { status: 400 });
    }

    // Create the user account
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError || !authData.user) {
      // If user already exists, just update the invite
      if (signUpError?.message?.includes("already")) {
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser?.users?.find((u) => u.email === email);
        if (found) {
          await supabase
            .from("team_members")
            .update({ user_id: found.id, accepted_at: new Date().toISOString() })
            .eq("id", inviteId);
          return NextResponse.json({ success: true });
        }
      }
      return NextResponse.json({ error: signUpError?.message ?? "Failed to create account" }, { status: 400 });
    }

    // Link the user to the team member record
    await supabase
      .from("team_members")
      .update({ user_id: authData.user.id, accepted_at: new Date().toISOString() })
      .eq("id", inviteId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Accept invite error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
