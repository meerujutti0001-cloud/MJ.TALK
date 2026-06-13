import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { NotificationsList } from "@/components/dashboard/notifications-list";

export default async function NotificationsPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  const supabase = createServiceClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, conversation:conversations(id, visitor_name, status, chatbot_id, chatbots(name))")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-600" />
          Notifications
        </h1>
        <p className="text-slate-500 text-sm mt-1">Escalations, flags, and idle conversation alerts.</p>
      </div>
      <NotificationsList notifications={notifications ?? []} orgId={orgId} />
    </div>
  );
}
