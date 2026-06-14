import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const user = await requireAuth();
  const supabase = createServiceClient();

  // Get user's org
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  // If no org yet, redirect to setup
  if (!org) redirect("/dashboard/setup");

  // If they've already completed onboarding (have a chatbot), go to dashboard
  const { data: existingBot } = await supabase
    .from("chatbots")
    .select("id")
    .eq("org_id", org.id)
    .limit(1)
    .maybeSingle();

  if (existingBot) redirect("/dashboard");

  return <OnboardingFlow orgId={org.id} orgName={org.name} userEmail={user.email ?? ""} />;
}
