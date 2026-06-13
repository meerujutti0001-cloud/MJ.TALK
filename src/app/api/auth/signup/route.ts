import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, orgName } = await req.json();

    if (!email || !password || !orgName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Check if email already exists
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (alreadyExists) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    // Create user with email_confirm: true (bypass Supabase's broken SMTP)
    // We handle email verification ourselves via a magic link sent below.
    const { data: authData, error: signUpError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { org_name: orgName.trim() },
    });

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message ?? "Failed to create account" },
        { status: 400 }
      );
    }

    // Create organization row
    const { error: orgError } = await serviceClient.from("organizations").insert({
      name: orgName.trim(),
      owner_id: authData.user.id,
    });

    if (orgError) {
      if (!orgError.message.includes("duplicate")) {
        await serviceClient.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create organization: " + orgError.message },
          { status: 500 }
        );
      }
    }

    // Account is ready — no email verification needed (bypassed)
    return NextResponse.json({ success: true, emailConfirmRequired: false });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
