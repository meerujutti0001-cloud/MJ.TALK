import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Enable edge runtime for faster response
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin (only meerujutti0.001@gmail.com)
    const ADMIN_EMAIL = "meerujutti0.001@gmail.com";
    
    // Check by email first (most reliable)
    const isAdminByEmail = user.email === ADMIN_EMAIL;
    
    // Also check profile role from database
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = isAdminByEmail || profile?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["pending_review", "pending_payment", "approved", "completed", "cancelled", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Update the purchase request status
    const { error: updateError } = await supabase
      .from("purchase_requests")
      .update({
        status,
        processed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
    });

  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
