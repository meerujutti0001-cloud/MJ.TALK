import { requireAuth } from "@/lib/auth";
import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { ChatbotForm } from "@/components/dashboard/chatbot-form";

export default async function NewChatbotPage() {
  const user = await requireAuth();
  const orgId = await getOrgId(user.id);
  if (!orgId) redirect("/dashboard/setup");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Chatbot</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your AI support agent.</p>
      </div>
      <ChatbotForm orgId={orgId} />
    </div>
  );
}
