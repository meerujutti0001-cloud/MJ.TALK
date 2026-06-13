"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Chatbot } from "@/types";

interface ChatbotFormProps {
  orgId: string;
  chatbot?: Chatbot;
}

const WIDGET_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Teal", value: "#14b8a6" },
];

const DEFAULT_SYSTEM_PROMPT = `You are a helpful customer support assistant. Your role is to:
- Answer customer questions clearly and concisely
- Be friendly, professional, and empathetic
- Help troubleshoot common issues
- Escalate complex issues by responding with the word ESCALATE when you cannot resolve them

Always stay on topic and within the scope of customer support. If you don't know the answer, say so honestly rather than guessing.`;

export function ChatbotForm({ orgId, chatbot }: ChatbotFormProps) {
  const router = useRouter();
  const isEditing = !!chatbot;

  const [name, setName] = useState(chatbot?.name ?? "");
  const [description, setDescription] = useState(chatbot?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(chatbot?.system_prompt ?? DEFAULT_SYSTEM_PROMPT);
  const [status, setStatus] = useState<"active" | "inactive">(chatbot?.status ?? "active");
  const [widgetColor, setWidgetColor] = useState(chatbot?.widget_color ?? "#6366f1");
  const [customColor, setCustomColor] = useState(chatbot?.widget_color ?? "#6366f1");
  const [preChatFormEnabled, setPreChatFormEnabled] = useState(chatbot?.pre_chat_form_enabled ?? false);
  const [escalationKeyword, setEscalationKeyword] = useState(chatbot?.escalation_keyword ?? "ESCALATE");
  const [allowedDomains, setAllowedDomains] = useState((chatbot?.allowed_domains ?? []).join("\n"));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const domainsArray = allowedDomains
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);

    const payload = {
      org_id: orgId,
      name: name.trim(),
      description: description.trim() || null,
      system_prompt: systemPrompt.trim(),
      status,
      widget_color: widgetColor,
      pre_chat_form_enabled: preChatFormEnabled,
      escalation_keyword: escalationKeyword.trim() || "ESCALATE",
      allowed_domains: domainsArray.length > 0 ? domainsArray : null,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from("chatbots").update(payload).eq("id", chatbot.id));
    } else {
      ({ error } = await supabase.from("chatbots").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: isEditing ? "Chatbot updated" : "Chatbot created" });
    router.push("/dashboard/chatbots");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Chatbot Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Support Bot"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this chatbot's purpose"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              System Prompt
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This defines your AI agent&apos;s persona, behavior, and capabilities. Include instructions on when to escalate using your escalation keyword.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful customer support assistant..."
            className="min-h-[200px] font-mono text-sm resize-y"
            required
          />
          <p className="text-xs text-slate-400 mt-2">{systemPrompt.length} characters</p>
        </CardContent>
      </Card>

      {/* Widget Appearance */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Widget Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Widget Color</Label>
            <div className="flex flex-wrap gap-2">
              {WIDGET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { setWidgetColor(c.value); setCustomColor(c.value); }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    widgetColor === c.value ? "border-slate-900 scale-110" : "border-transparent hover:border-slate-300"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
              {/* Custom color picker */}
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); setWidgetColor(e.target.value); }}
                  className="w-8 h-8 rounded-lg border-2 border-slate-300 cursor-pointer p-0.5 bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Selected: <span className="font-mono">{widgetColor}</span></p>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-3">Preview</p>
            <div className="flex items-end justify-end">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                style={{ backgroundColor: widgetColor }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Settings */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Behavior Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="preChatForm" className="text-sm font-medium">Pre-chat Form</Label>
              <p className="text-xs text-slate-500">Ask visitors for their name and email before starting the chat.</p>
            </div>
            <Switch
              id="preChatForm"
              checked={preChatFormEnabled}
              onCheckedChange={setPreChatFormEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="escalationKeyword">Escalation Keyword</Label>
            <Input
              id="escalationKeyword"
              value={escalationKeyword}
              onChange={(e) => setEscalationKeyword(e.target.value)}
              placeholder="ESCALATE"
              className="font-mono uppercase"
            />
            <p className="text-xs text-slate-500">
              When the AI response contains this word, the conversation is flagged for human review.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowedDomains">Allowed Domains</Label>
            <Textarea
              id="allowedDomains"
              value={allowedDomains}
              onChange={(e) => setAllowedDomains(e.target.value)}
              placeholder={"example.com\napp.example.com"}
              className="min-h-[80px] font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              One domain per line. Leave empty to allow all domains.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEditing ? "Saving..." : "Creating..."}</>
          ) : (
            isEditing ? "Save Changes" : "Create Chatbot"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
