import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth";
import { getOrgId } from "@/lib/get-org";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getOrgId(user.id);
    if (!orgId) return NextResponse.json({ error: "No org found" }, { status: 403 });

    // Only super_admin can activate enterprise
    const role = await getUserRole(user.id, orgId);
    if (role !== "super_admin") {
      return NextResponse.json({ error: "Only super admins can activate enterprise plans" }, { status: 403 });
    }

    const { requestId, targetOrgId, adminNotes } = await req.json();
    if (!requestId || !targetOrgId) {
      return NextResponse.json({ error: "requestId and targetOrgId are required" }, { status: 400 });
    }

    const service = createServiceClient();

    // Get the purchase request for the prospect's email
    const { data: request } = await service
      .from("purchase_requests")
      .select("email, full_name, company_name, order_id")
      .eq("id", requestId)
      .maybeSingle();

    if (!request) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    // Activate enterprise on the target org (no expiry for enterprise)
    const { error: updateError } = await service
      .from("organizations")
      .update({
        plan: "enterprise",
        plan_expires_at: null,
      })
      .eq("id", targetOrgId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Mark purchase request as completed
    await service
      .from("purchase_requests")
      .update({
        status: "completed",
        admin_notes: adminNotes ?? "Enterprise plan activated by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // Send activation email to the enterprise customer
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app";

    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: "MJ.TALK Team <onboarding@resend.dev>",
          to: [request.email],
          subject: `🎉 Your Enterprise plan is now active — MJ.TALK`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
              <div style="background:linear-gradient(135deg,#042e2e,#0d8585);padding:24px;border-radius:12px;margin-bottom:24px">
                <h1 style="color:#fff;margin:0;font-size:22px">MJ<span style="color:#1dbfa0">.</span>TALK Enterprise</h1>
                <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px">Your plan has been activated</p>
              </div>
              <p style="color:#0a1628;font-size:15px">Hi ${request.full_name},</p>
              <p style="color:#374151;font-size:14px;line-height:1.7">
                Great news! Your <strong>Enterprise plan for ${request.company_name}</strong> is now active.
                All Enterprise features are immediately available in your dashboard.
              </p>
              <div style="background:#edfaf7;border:1px solid #d4f4ee;padding:16px;border-radius:8px;margin:20px 0">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0a7070">What's now unlocked:</p>
                <ul style="margin:0;padding:0 0 0 16px;color:#374151;font-size:13px;line-height:1.8">
                  <li>Unlimited chats &amp; AI replies</li>
                  <li>Unlimited agent seats</li>
                  <li>White-label widget</li>
                  <li>SLA guarantee</li>
                  <li>Dedicated account manager</li>
                  <li>SSO &amp; advanced security</li>
                </ul>
              </div>
              <div style="text-align:center;margin:28px 0">
                <a href="${APP_URL}/dashboard" style="background:#0d8585;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
                  Go to Dashboard →
                </a>
              </div>
              <p style="color:#5a7878;font-size:13px;border-top:1px solid #f0f0f0;padding-top:16px;margin-top:24px">
                Reference: <strong>${request.order_id}</strong><br>
                Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#0d8585">${SUPPORT_EMAIL}</a>
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[activate-enterprise] Email failed:", emailErr);
      }
    }

    return NextResponse.json({ success: true, message: "Enterprise plan activated" });
  } catch (err) {
    console.error("[activate-enterprise] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
