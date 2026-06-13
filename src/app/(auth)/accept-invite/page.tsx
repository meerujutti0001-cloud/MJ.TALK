"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Users } from "lucide-react";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("id");
  const orgName = searchParams.get("org") ?? "your team";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!inviteId) return;
    // Initialize Supabase inside effect — safe, client-only
    const supabase = createClient();
    supabase
      .from("team_members")
      .select("email")
      .eq("id", inviteId)
      .single()
      .then(({ data }) => { if (data) setEmail(data.email); });
  }, [inviteId]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!inviteId || !email) { setError("Invalid invitation link"); return; }

    setLoading(true);

    // Sign up via API (auto-confirms the user)
    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, inviteId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create account");
      setLoading(false);
      return;
    }

    // Sign in
    const supabase = createClient(); // inside handler — safe
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Account created. Please sign in.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  if (!inviteId) {
    return (
      <div className="text-center text-red-400 p-8">
        Invalid invitation link. Please ask your admin to resend the invite.
      </div>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardHeader className="space-y-1 text-center">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-1">
          <Users className="w-6 h-6 text-indigo-400" />
        </div>
        <CardTitle className="text-2xl text-white">Accept invitation</CardTitle>
        <CardDescription className="text-slate-400">
          You&apos;ve been invited to join <strong className="text-slate-300">{orgName}</strong>.
          Create a password to get started.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleAccept}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {email && (
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input value={email} disabled className="bg-slate-700/50 border-slate-600 text-slate-400" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining...</> : "Join workspace"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">SupportAI</span>
        </div>
        <Suspense fallback={<div className="text-slate-400 text-center">Loading...</div>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
