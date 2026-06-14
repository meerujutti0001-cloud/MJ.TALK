import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, category } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mjtalk.com";
    const resendKey    = process.env.RESEND_API_KEY;

    if (!resendKey) {
      // Fallback: just log it and return success so the UI still works
      console.log("[contact] No RESEND_API_KEY — logging submission:", { name, email, subject, message, category });
      return NextResponse.json({ success: true, fallback: true }, { headers: CORS });
    }

    const resend = new Resend(resendKey);

    // Email to support team
    await resend.emails.send({
      from: "MJ.TALK Contact <onboarding@resend.dev>",
      to: [supportEmail],
      replyTo: email,
      subject: `[${category ?? "General"}] ${subject ?? "Support Request"} — ${name}`,
      html: `
        <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f8fafc;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#0a0f1e,#0d8585);padding:1.5rem;border-radius:10px;margin-bottom:1.5rem;">
            <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:700;">MJ<span style="color:#1dbfa0">.</span>TALK Support Request</h1>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
            <tr><td style="padding:0.5rem 0;font-weight:600;color:#374151;width:120px;">From</td><td style="padding:0.5rem 0;color:#1f2937;">${name} &lt;${email}&gt;</td></tr>
            <tr><td style="padding:0.5rem 0;font-weight:600;color:#374151;">Category</td><td style="padding:0.5rem 0;color:#1f2937;">${category ?? "General"}</td></tr>
            <tr><td style="padding:0.5rem 0;font-weight:600;color:#374151;">Subject</td><td style="padding:0.5rem 0;color:#1f2937;">${subject ?? "No subject"}</td></tr>
          </table>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:1.25rem;margin-bottom:1.5rem;">
            <p style="margin:0;color:#374151;font-size:0.95rem;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
          </div>
          <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    });

    // Auto-reply to user
    await resend.emails.send({
      from: "MJ.TALK Support <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message — MJ.TALK Support",
      html: `
        <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f8fafc;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#0a0f1e,#0d8585);padding:1.5rem;border-radius:10px;margin-bottom:1.5rem;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:700;">MJ<span style="color:#1dbfa0">.</span>TALK</h1>
          </div>
          <h2 style="color:#1f2937;font-size:1.15rem;margin-bottom:0.5rem;">Thanks for reaching out, ${name}! 👋</h2>
          <p style="color:#6b7280;line-height:1.7;margin-bottom:1.5rem;">
            We've received your message and our support team will get back to you within <strong style="color:#0d8585;">24 hours</strong> (usually much faster).
          </p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-left:4px solid #0d8585;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin-bottom:1.5rem;">
            <p style="margin:0;font-weight:600;color:#374151;font-size:0.85rem;">Your message:</p>
            <p style="margin:0.5rem 0 0;color:#6b7280;font-size:0.9rem;white-space:pre-wrap;">${message.replace(/</g,"&lt;").replace(/>/g,"&gt;").slice(0,300)}${message.length > 300 ? "…" : ""}</p>
          </div>
          <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">
            This is an automated confirmation. Please don't reply to this email.<br/>
            To contact us directly, email <a href="mailto:${supportEmail}" style="color:#0d8585;">${supportEmail}</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { headers: CORS });

  } catch (error) {
    console.error("[contact] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try emailing us directly." },
      { status: 500, headers: CORS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
