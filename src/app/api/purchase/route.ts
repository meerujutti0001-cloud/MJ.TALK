import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const body = await req.json();
    const {
      plan,
      companyName,
      companySize,
      industry,
      website,
      taxId,
      fullName,
      email,
      phone,
      jobTitle,
      billingAddress,
      city,
      state,
      zipCode,
      country,
      paymentMethod,
      billingCycle,
      expectedUsers,
      expectedChats,
      requiredFeatures,
      specialRequirements,
    } = body;

    // Validation
    if (!companyName || !email || !phone || !fullName) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;


    // Store purchase request in database
    const { error: insertError } = await supabase
      .from("purchase_requests")
      .insert({
        order_id: orderId,
        user_id: user?.id || null,
        plan_type: plan,
        company_name: companyName,
        company_size: companySize,
        industry,
        website,
        tax_id: taxId,
        full_name: fullName,
        email,
        phone,
        job_title: jobTitle,
        billing_address: billingAddress,
        city,
        state,
        zip_code: zipCode,
        country,
        payment_method: paymentMethod,
        billing_cycle: billingCycle,
        expected_users: expectedUsers,
        expected_chats: expectedChats,
        required_features: requiredFeatures,
        special_requirements: specialRequirements,
        status: plan === "enterprise" ? "pending_review" : "pending_payment",
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      // Continue even if database insert fails
    }

    // Send notification email to support team
    const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@mjtalk.com";
    
    const emailBody = `
New ${plan.toUpperCase()} Plan Request

Order ID: ${orderId}
Plan: ${plan}
Status: ${plan === "enterprise" ? "Pending Review" : "Pending Payment"}

Company Information:
- Company: ${companyName}
- Size: ${companySize}
- Industry: ${industry}
- Website: ${website || "N/A"}
- Tax ID: ${taxId || "N/A"}

Contact Information:
- Name: ${fullName}
- Job Title: ${jobTitle}
- Email: ${email}
- Phone: ${phone}

Billing Address:
${billingAddress}
${city}, ${state} ${zipCode}
${country}

${plan === "enterprise" ? `
Additional Requirements:
- Expected Users: ${expectedUsers || "N/A"}
- Expected Chats: ${expectedChats || "N/A"}
- Required Features: ${requiredFeatures?.join(", ") || "N/A"}
- Special Requirements: ${specialRequirements || "N/A"}
` : `
Payment Information:
- Method: ${paymentMethod}
- Billing Cycle: ${billingCycle}
`}

---
Please review and process this request as soon as possible.
    `.trim();

    // Log for now (implement actual email sending later)
    console.log("Purchase Request Email:", emailBody);

    return NextResponse.json({
      success: true,
      orderId,
      message: plan === "enterprise" 
        ? "Your request has been submitted successfully. Our sales team will contact you within 24 hours."
        : "Your purchase request has been received. Redirecting to confirmation...",
    });

  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
