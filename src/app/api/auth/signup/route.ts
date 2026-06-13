import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, orgName } = await req.json();

    if (!email || !password || !orgName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Use the anon/public client for signUp — this is the ONLY method that
    // actually triggers Supabase's confirmation email delivery.
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/dashboard`,   // where user lands after clicking email link
        data: { org_name: orgName.trim() },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 400 }
      );
    }

    // Pre-create the organization row using the service role (bypasses RLS).
    // The user won't have a session until they confirm their email, but the row
    // is safe to create now so the dashboard works instantly after confirmation.
    const serviceClient = createServiceClient();
    const { error: orgError } = await serviceClient.from("organizations").insert({
      name: orgName.trim(),
      owner_id: signUpData.user.id,
    });

    if (orgError) {
      // Rollback the auth user so the state stays consistent
      await serviceClient.auth.admin.deleteUser(signUpData.user.id);
      return NextResponse.json(
        { error: "Failed to create organization: " + orgError.message },
        { status: 500 }
      );
    }

    // Supabase has queued the confirmation email. Tell the client to show the
    // "check your inbox" screen.
    return NextResponse.json({ success: true, emailConfirmRequired: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
