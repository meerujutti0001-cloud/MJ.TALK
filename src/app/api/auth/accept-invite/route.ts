import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ── GET /api/auth/accept-invite?id=<inviteId>
   Returns the email on the invite so the page can prefill it
   without needing the user to be authenticated (uses service client). */
export async function GET(req: NextRequest) {
  try {
    const inviteId = req.nextUrl.searchParams.get("id");
    if (!inviteId) {
      return NextResponse.json({ error: "Missing invite id" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: invite, error } = await supabase
      .from("team_members")
      .select("id, email, org_id, accepted_at")
      .eq("id", inviteId)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 410 });
    }

    return NextResponse.json({ email: invite.email });
  } catch (err) {
    console.error("Accept invite GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, inviteId } = await req.json();

    if (!email || !password || !inviteId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify invite exists and is valid
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

    // Create the user account (email_confirm: true skips email verification)
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError || !authData.user) {
      // If user already exists, just link and accept the invite
      if (signUpError?.message?.toLowerCase().includes("already")) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const found = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
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

    // Link the new user to the team member record
    await supabase
      .from("team_members")
      .update({ user_id: authData.user.id, accepted_at: new Date().toISOString() })
      .eq("id", inviteId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Accept invite POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
