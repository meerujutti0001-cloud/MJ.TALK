import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Generates a password reset link via admin API (bypasses Supabase SMTP).
// Returns the link so the client can show it, OR we redirect directly.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

    const serviceClient = createServiceClient();

    // Generate a password reset link — this does NOT send an email,
    // it returns the link which we can redirect the user to directly.
    const { data, error } = await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    if (error) {
      console.error("Reset link error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return the action link — client will redirect user there directly
    return NextResponse.json({
      success: true,
      actionLink: data.properties?.action_link,
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
