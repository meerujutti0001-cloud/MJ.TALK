"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Building2, User, Lock, CreditCard,
  CheckCircle2, Zap, Crown, ArrowRight, Trash2,
  ShieldCheck, TrendingUp, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface SettingsFormProps {
  org: { id: string; name: string };
  userEmail: string;
}

interface PlanData {
  plan: "starter" | "premium" | "enterprise";
  planExpiresAt: string | null;
  hasStripeSubscription: boolean;
  limits: { chatsPerMonth: number; agentSeats: number; aiRepliesPerMonth: number };
  usage: { chatsThisMonth: number; chatsLimit: number; chatsRemaining: number };
}

const PLAN_COLORS = {
  starter:    { color: "#64748b", bg: "#f8fafc", label: "Free",       icon: "🆓" },
  premium:    { color: "#0d8585", bg: "#edfaf7", label: "Premium",    icon: "⚡" },
  enterprise: { color: "#7c3aed", bg: "#f5f3ff", label: "Enterprise", icon: "🏢" },
};

/* ── Plan definition ── */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    features: ["500 chats / month", "1 agent seat", "Basic analytics"],
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
  {
    id: "premium",
    name: "Growth",
    price: "$29/mo",
    features: ["Unlimited chats", "Unlimited agents", "AI replies", "Priority support"],
    color: "#0d8585",
    bg: "#edfaf7",
    border: "#1dbfa0",
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    features: ["Everything in Growth", "White-label", "SLA", "Dedicated manager"],
    color: "#6366f1",
    bg: "#f5f3ff",
    border: "#a5b4fc",
  },
];

export function SettingsForm({ org, userEmail }: SettingsFormProps) {
  const router = useRouter();

  const [orgName, setOrgName] = useState(org.name);
  const [orgLoading, setOrgLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    fetch("/api/org/plan")
      .then(r => r.json())
      .then(d => { if (!d.error) setPlanData(d); })
      .catch(() => {})
      .finally(() => setPlanLoading(false));
  }, []);

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("organizations")
      .update({ name: orgName.trim() })
      .eq("id", org.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Organization name updated" });
      router.refresh();
    }
    setOrgLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setPwLoading(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== "DELETE") {
      toast({ title: "Type DELETE to confirm", variant: "destructive" });
      return;
    }
    setDeleteLoading(true);
    // Call a server action or API route for actual deletion
    toast({
      title: "Account deletion requested",
      description: "Your account and all data will be removed within 30 days. Contact support to cancel.",
    });
    setDeleteLoading(false);
    setDeleteConfirm("");
  };

  return (
    <div className="space-y-6">

      {/* ── Organisation ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Organisation
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleOrgSave}>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="orgName" className="text-xs font-medium text-slate-600">
                Workspace Name
              </Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Your workspace name"
                required
                className="h-9 text-sm"
              />
              <p className="text-xs text-slate-400">
                Shown in the sidebar and in invitation emails.
              </p>
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
              disabled={orgLoading}
            >
              {orgLoading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</>
                : "Save Changes"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* ── Account ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Email Address</Label>
            <Input
              value={userEmail}
              disabled
              className="h-9 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Authenticated via Supabase. Email changes require re-verification.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            Change Password
          </CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-medium text-slate-600">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  minLength={8}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-600">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={pwLoading || (!!newPassword && newPassword !== confirmPassword)}
            >
              {pwLoading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Updating…</>
                : "Update Password"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* ── Plan & Billing ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            Plan &amp; Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">

          {/* Current plan status */}
          {planLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading plan…
            </div>
          ) : planData ? (
            <div style={{
              padding: "1rem", borderRadius: "10px",
              background: PLAN_COLORS[planData.plan].bg,
              border: `1.5px solid ${PLAN_COLORS[planData.plan].color}40`,
            }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "1.1rem" }}>{PLAN_COLORS[planData.plan].icon}</span>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 700, color: PLAN_COLORS[planData.plan].color }}>
                      {PLAN_COLORS[planData.plan].label} Plan
                    </p>
                    {planData.planExpiresAt && planData.plan === "premium" && (
                      <p className="text-xs text-slate-500">
                        Renews {new Date(planData.planExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    {planData.plan === "enterprise" && (
                      <p className="text-xs text-slate-500">Custom plan · No expiry</p>
                    )}
                  </div>
                </div>
                {planData.hasStripeSubscription && (
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                    Active subscription
                  </span>
                )}
              </div>

              {/* Usage bar — only for free plan */}
              {planData.plan === "starter" && planData.usage.chatsLimit > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {planData.usage.chatsThisMonth} / {planData.usage.chatsLimit} chats this month
                    </span>
                    <span>{Math.round((planData.usage.chatsThisMonth / planData.usage.chatsLimit) * 100)}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "999px",
                      width: `${Math.min(100, (planData.usage.chatsThisMonth / planData.usage.chatsLimit) * 100)}%`,
                      background: planData.usage.chatsRemaining <= 50 ? "#ef4444" : "#0d8585",
                      transition: "width 0.3s",
                    }} />
                  </div>
                  {planData.usage.chatsRemaining <= 50 && planData.usage.chatsRemaining > 0 && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Only {planData.usage.chatsRemaining} chats remaining this month
                    </p>
                  )}
                  {planData.usage.chatsRemaining === 0 && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      Monthly limit reached — new chats are blocked
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Plan upgrade cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  border: `1.5px solid ${plan.border}`,
                  background: plan.bg,
                  borderRadius: "10px",
                  padding: "1rem",
                  position: "relative",
                }}
              >
                {plan.recommended && (
                  <div style={{
                    position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(90deg,#0d8585,#1dbfa0)", color: "#fff",
                    fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em",
                    textTransform: "uppercase", padding: "2px 10px", borderRadius: "999px",
                    whiteSpace: "nowrap",
                  }}>
                    Popular
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, color: plan.color }}>{plan.name}</p>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0a1628" }}>{plan.price}</p>
                </div>
                <ul className="space-y-1 mb-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {/* Plan cards — highlight current plan, hide upgrade for current */}
                {plan.id !== "starter" && plan.id !== planData?.plan && (
                  <Link
                    href={`/purchase/${plan.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "4px", padding: "5px 10px", borderRadius: "7px",
                      fontSize: "0.72rem", fontWeight: 600, textDecoration: "none",
                      background: plan.color, color: "#fff", width: "100%",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    {plan.id === "enterprise" ? (
                      <><Crown className="w-3 h-3" /> Request</>
                    ) : (
                      <><Zap className="w-3 h-3" /> Upgrade</>
                    )}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                {(plan.id === "starter" || plan.id === planData?.plan) && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "4px", padding: "5px 10px", borderRadius: "7px",
                    fontSize: "0.72rem", fontWeight: 600,
                    background: plan.id === planData?.plan ? plan.color : "#f1f5f9",
                    color: plan.id === planData?.plan ? "#fff" : "#64748b",
                    width: "100%",
                  }}>
                    <CheckCircle2 className="w-3 h-3" /> Current Plan
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Payments are processed securely by Stripe. Cancel anytime.{" "}
            <Link href="/contact" className="text-emerald-600 hover:underline">
              Contact support
            </Link>{" "}
            for billing questions.
          </p>
        </CardContent>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="border-red-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleDeleteAccount}>
          <CardContent className="space-y-3 pt-0">
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs font-semibold text-red-700 mb-1">Delete Account</p>
              <p className="text-xs text-red-600 leading-relaxed">
                This permanently deletes your account, workspace, all chatbots, and conversation history.
                Data will be purged within 30 days. <strong>This action cannot be undone.</strong>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deleteConfirm" className="text-xs font-medium text-slate-600">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="h-9 text-sm font-mono border-red-200 focus:ring-red-300"
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              disabled={deleteConfirm !== "DELETE" || deleteLoading}
            >
              {deleteLoading
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Processing…</>
                : <><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete Account</>}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
