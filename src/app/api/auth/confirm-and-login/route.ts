import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Called when login fails with "Email not confirmed".
// Force-confirms the user via admin API so they can sign in immediately.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const serviceClient = createServiceClient();

    // Find user by email
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
    const user = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (user.email_confirmed_at) {
      // Already confirmed — nothing to do
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    // Force-confirm
    const { error } = await serviceClient.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Confirm error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
