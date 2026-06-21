"use client";

import { useState } from "react";
import { UserPlus, Trash2, Loader2, Crown, User, Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import type { TeamMember } from "@/types";

interface TeamManagementProps {
  orgId: string;
  orgName: string;
  members: TeamMember[];
  isOwner: boolean;
}

export function TeamManagement({ orgId, orgName, members: initialMembers, isOwner }: TeamManagementProps) {
  const [members, setMembers] = useState(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"agent">("agent");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient(); // inside handler — safe

    const { data, error } = await supabase
      .from("team_members")
      .insert({ org_id: orgId, email: inviteEmail.trim(), role: inviteRole })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create invite", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const link = `${appUrl}/accept-invite?id=${data.id}&org=${encodeURIComponent(orgName)}`;
    setInviteLink(link);
    setMembers((prev) => [data as TeamMember, ...prev]);
    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast({ title: "Invite link copied!" });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCloseInvite = () => {
    setInviteOpen(false);
    setInviteLink(null);
    setInviteEmail("");
  };

  const handleRemove = async (memberId: string) => {
    setDeletingId(memberId);
    try {
      const res = await fetch("/api/team/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Failed to remove member", description: data.error ?? "Unknown error", variant: "destructive" });
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast({ title: "Member removed" });
      }
    } catch {
      toast({ title: "Failed to remove member", description: "Network error", variant: "destructive" });
    }
    setDeletingId(null);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Team Members</CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Agents can view conversations but cannot modify chatbot settings.
            </p>
          </div>
          {isOwner && (
            <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) handleCloseInvite(); else setInviteOpen(true); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Generate an invite link to share with your team member.
                  </DialogDescription>
                </DialogHeader>

                {inviteLink ? (
                  // Step 2: Show invite link
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Invite created!</p>
                      <p className="text-xs text-green-700">
                        Share this link with <strong>{inviteEmail}</strong>. It lets them create an account and join your workspace.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={inviteLink}
                        readOnly
                        className="font-mono text-xs bg-slate-50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyLink}
                        className="flex-shrink-0"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCloseInvite}>Done</Button>
                    </DialogFooter>
                  </div>
                ) : (
                  // Step 1: Enter email
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">Email Address</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "agent")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent — can view conversations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleCloseInvite}>Cancel</Button>
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2" disabled={loading}>
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
                          : <><Link2 className="w-4 h-4" />Generate Link</>
                        }
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {members.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">
            No team members yet. Invite someone to collaborate.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-6 py-4">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                    {getInitials(member.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{member.email}</p>
                  <p className="text-xs text-slate-400">
                    Invited {formatRelativeTime(member.invited_at)}
                    {" · "}
                    {member.accepted_at
                      ? <span className="text-green-600">Accepted</span>
                      : <span className="text-amber-600">Pending</span>
                    }
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  member.role === "owner"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {member.role === "owner" ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {member.role}
                </span>
                {isOwner && member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => handleRemove(member.id)}
                    disabled={deletingId === member.id}
                  >
                    {deletingId === member.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
