"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Loader2, MessageCircle, CheckCircle } from "lucide-react";

export default function SetupPage() {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/setup-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orgName: orgName.trim() }),
      });

      let data: { success?: boolean; error?: string; orgId?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(`Server returned status ${res.status} with no JSON body`);
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error ?? `Error ${res.status}: Failed to create workspace`);
        setLoading(false);
        return;
      }

      // Show success state briefly before navigating
      setSuccess(true);
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 800);
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">SupportAI</span>
        </div>

        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto">
              {success
                ? <CheckCircle className="w-6 h-6 text-green-400" />
                : <Building2 className="w-6 h-6 text-emerald-400" />
              }
            </div>
            <CardTitle className="text-white">
              {success ? "Workspace created!" : "Set up your workspace"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {success
                ? "Redirecting to your dashboard..."
                : "Enter your organization name to get started."
              }
            </CardDescription>
          </CardHeader>

          {!success && (
            <form onSubmit={handleSetup}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg font-mono break-all">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-gray-300">
                    Organization Name
                  </Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    autoFocus
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={loading || !orgName.trim()}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating workspace...</>
                  ) : (
                    "Create Workspace"
                  )}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
