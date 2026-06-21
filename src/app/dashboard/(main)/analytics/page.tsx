import { requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/auth";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";

export default async function AnalyticsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  // Agents cannot access analytics
  const role = await getUserRole(user.id, orgId);
  if (role === "agent" || role === "guest") {
    redirect("/dashboard/conversations");
  }

  return <AnalyticsDashboard />;
}
