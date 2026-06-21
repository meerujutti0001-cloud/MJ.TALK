import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      companyName, companySize, industry, website, taxId,
      fullName, email, phone, jobTitle,
      billingAddress, city, state, zipCode, country,
      expectedUsers, expectedChats, specialRequirements,
    } = body;

    if (!companyName || !fullName || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderId = `ENT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const service = createServiceClient();

    // Save to DB
    const { error: dbError } = await service
      .from("purchase_requests")
      .insert({
        order_id: orderId,
        user_id: user?.id ?? null,
        plan_type: "enterprise",
        company_name: companyName,
        company_size: companySize,
        industry,
        website: website ?? null,
        tax_id: taxId ?? null,
        full_name: fullName,
        email,
        phone,
        job_title: jobTitle,
        billing_address: billingAddress,
        city,
        state,
        zip_code: zipCode,
        country,
        expected_users: expectedUsers ?? null,
        expected_chats: expectedChats ?? null,
        special_requirements: specialRequirements ?? null,
        status: "pending_review",
      });

    if (dbError) {
      console.error("[enterprise/inquiry] DB error:", dbError);
      // Don't fail — still send email
    }

    // Send email to sales team via Resend
    const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);

        // Email to sales team
        await resend.emails.send({
          from: "MJ.TALK Sales <onboarding@resend.dev>",
          to: [SUPPORT_EMAIL],
          subject: `🏢 New Enterprise Inquiry — ${companyName} [${orderId}]`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
              <div style="background:linear-gradient(135deg,#042e2e,#0d8585);padding:24px;border-radius:12px;margin-bottom:24px">
                <h1 style="color:#fff;margin:0;font-size:22px">New Enterprise Inquiry</h1>
                <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px">Order ID: <strong style="color:#1dbfa0">${orderId}</strong></p>
              </div>

              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr><td colspan="2" style="background:#f8fbfb;padding:12px 16px;border-radius:8px 8px 0 0;font-weight:700;color:#0a1628;font-size:13px">🏢 COMPANY</td></tr>
                <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px;width:40%">Company Name</td><td style="padding:10px 16px;font-weight:600;font-size:13px">${companyName}</td></tr>
                <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px">Company Size</td><td style="padding:10px 16px;font-size:13px">${companySize}</td></tr>
                <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px">Industry</td><td style="padding:10px 16px;font-size:13px">${industry}</td></tr>
                <tr><td style="padding:10px 16px;color:#5a7878;font-size:13px">Website</td><td style="padding:10px 16px;font-size:13px">${website || "—"}</td></tr>
              </table>

              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr><td colspan="2" style="background:#f8fbfb;padding:12px 16px;border-radius:8px 8px 0 0;font-weight:700;color:#0a1628;font-size:13px">👤 CONTACT</td></tr>
                <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px;width:40%">Name</td><td style="padding:10px 16px;font-weight:600;font-size:13px">${fullName}</td></tr>
                <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px">Title</td><td style="padding:10px 16px;font-size:13px">${jobTitle}</td></tr>
                <tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px">Email</td><td style="padding:10px 16px;font-size:13px"><a href="mailto:${email}" style="color:#0d8585">${email}</a></td></tr>
                <tr><td style="padding:10px 16px;color:#5a7878;font-size:13px">Phone</td><td style="padding:10px 16px;font-size:13px">${phone}</td></tr>
              </table>

              ${expectedUsers || expectedChats || specialRequirements ? `
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr><td colspan="2" style="background:#f8fbfb;padding:12px 16px;border-radius:8px 8px 0 0;font-weight:700;color:#0a1628;font-size:13px">📋 REQUIREMENTS</td></tr>
                ${expectedUsers ? `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px;width:40%">Expected Users</td><td style="padding:10px 16px;font-size:13px">${expectedUsers}</td></tr>` : ""}
                ${expectedChats ? `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 16px;color:#5a7878;font-size:13px">Expected Chats/mo</td><td style="padding:10px 16px;font-size:13px">${expectedChats}</td></tr>` : ""}
                ${specialRequirements ? `<tr><td style="padding:10px 16px;color:#5a7878;font-size:13px">Special Requirements</td><td style="padding:10px 16px;font-size:13px">${specialRequirements}</td></tr>` : ""}
              </table>` : ""}

              <div style="background:#edfaf7;border:1px solid #d4f4ee;padding:16px;border-radius:8px;margin-top:20px">
                <p style="margin:0;font-size:13px;color:#0a1628">
                  <strong>Action required:</strong> Contact <a href="mailto:${email}" style="color:#0d8585">${email}</a> within 24 hours to discuss pricing and requirements.
                </p>
              </div>
            </div>
          `,
        });

        // Auto-reply to the prospect
        await resend.emails.send({
          from: "MJ.TALK Team <onboarding@resend.dev>",
          to: [email],
          subject: `We received your Enterprise inquiry — MJ.TALK [${orderId}]`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
              <div style="background:linear-gradient(135deg,#042e2e,#0d8585);padding:24px;border-radius:12px;margin-bottom:24px">
                <h1 style="color:#fff;margin:0;font-size:22px">MJ<span style="color:#1dbfa0">.</span>TALK</h1>
                <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px">Enterprise Plan Inquiry Received</p>
              </div>

              <p style="color:#0a1628;font-size:15px">Hi ${fullName},</p>
              <p style="color:#374151;font-size:14px;line-height:1.7">
                Thank you for your interest in MJ.TALK Enterprise. We've received your inquiry for <strong>${companyName}</strong>
                and our sales team will review your requirements shortly.
              </p>
              <p style="color:#374151;font-size:14px;line-height:1.7">
                <strong>What happens next:</strong><br>
                Our sales team will contact you at <strong>${email}</strong> within <strong>24 business hours</strong>
                to discuss custom pricing, technical requirements, and a tailored demo.
              </p>

              <div style="background:#f8fbfb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:20px 0">
                <p style="margin:0 0 8px;font-size:12px;color:#5a7878;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Your Reference</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#0a1628;font-family:monospace">${orderId}</p>
              </div>

              <p style="color:#374151;font-size:14px;line-height:1.7">
                In the meantime, feel free to <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app"}/signup" style="color:#0d8585">create a free account</a>
                and explore the platform. Enterprise features will be unlocked once your plan is activated.
              </p>

              <p style="color:#5a7878;font-size:13px;margin-top:32px;border-top:1px solid #f0f0f0;padding-top:16px">
                Questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#0d8585">${SUPPORT_EMAIL}</a>
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[enterprise/inquiry] Email send failed:", emailErr);
        // Don't fail the request — DB record was saved
      }
    } else {
      console.log("[enterprise/inquiry] RESEND_API_KEY not set — email not sent. Inquiry saved to DB:", orderId);
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: "Your Enterprise inquiry has been received. Our sales team will contact you within 24 hours.",
    });
  } catch (err) {
    console.error("[enterprise/inquiry] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
