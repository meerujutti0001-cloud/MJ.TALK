import { requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { PurchaseRequestsList } from "@/components/dashboard/purchase-requests-list";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Purchase Requests | MJ.TALK",
  description: "Manage customer purchase requests",
};

export default async function PurchaseRequestsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  // Server-side role guard — only super_admin can access this page
  const role = await getUserRole(user.id, orgId);
  if (role !== "super_admin") {
    redirect("/dashboard?error=forbidden");
  }

  const serviceClient = createServiceClient();

  const { data: purchaseRequests, error } = await serviceClient
    .from("purchase_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching purchase requests:", error);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0a1628", marginBottom: "0.5rem" }}>
            Purchase Requests
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#5a7878" }}>
            View and manage all Premium and Enterprise plan requests
          </p>
        </div>
        <PurchaseRequestsList initialRequests={purchaseRequests || []} />
      </div>
    </div>
  );
}
