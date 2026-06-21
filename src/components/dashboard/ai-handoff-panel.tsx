"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, Loader2, RefreshCw, ChevronDown,
  Brain, MessageSquare, Lightbulb, Target, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/* ─── Intent badge colors ─── */
const INTENT_COLORS: Record<string, string> = {
  refund:    "bg-amber-100 text-amber-700 border-amber-200",
  billing:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  account:   "bg-purple-100 text-purple-700 border-purple-200",
  technical: "bg-red-100 text-red-700 border-red-200",
  complaint: "bg-orange-100 text-orange-700 border-orange-200",
  setup:     "bg-indigo-100 text-indigo-700 border-indigo-200",
  general:   "bg-slate-100 text-slate-600 border-slate-200",
  other:     "bg-slate-100 text-slate-600 border-slate-200",
};

interface HandoffData {
  summary: string | null;
  problem: string | null;
  intent: string | null;
  confidence: number | null;
  suggestedResponse: string | null;
  cached: boolean;
}

interface AiHandoffPanelProps {
  conversationId: string;
  /** Only show if conversation is escalated */
  isEscalated: boolean;
  onUseSuggestion?: (text: string) => void;
}

export function AiHandoffPanel({
  conversationId,
  isEscalated,
  onUseSuggestion,
}: AiHandoffPanelProps) {
  const [data, setData]         = useState<HandoffData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Auto-load summary when escalated chat is opened
    if (isEscalated && !data && !loading && !dismissed) {
      loadSummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEscalated, conversationId]);

  async function loadSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/handoff-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to generate summary");
      }
      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate summary");
    } finally {
      setLoading(false);
    }
  }

  function handleUseSuggestion() {
    if (data?.suggestedResponse && onUseSuggestion) {
      onUseSuggestion(data.suggestedResponse);
      toast({ title: "Suggestion applied to reply box" });
    }
  }

  // Don't render if not escalated or dismissed
  if (!isEscalated || dismissed) return null;

  return (
    <div className="mx-4 mb-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <button
          onClick={() => setExpanded((s) => !s)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-emerald-800">AI Handoff Summary</span>
          {data?.cached && (
            <span className="text-xs text-emerald-500 font-normal">cached</span>
          )}
          {data?.intent && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-semibold border capitalize ml-1",
              INTENT_COLORS[data.intent] ?? INTENT_COLORS.general
            )}>
              {data.intent}
              {data.confidence && <span className="opacity-60 ml-1">{Math.round(data.confidence * 100)}%</span>}
            </span>
          )}
          <ChevronDown className={cn(
            "w-3.5 h-3.5 text-emerald-500 ml-auto transition-transform",
            expanded && "rotate-180"
          )} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 text-emerald-400 hover:text-emerald-600 transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-emerald-100 px-3 py-3 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analyzing conversation…
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between text-xs text-red-600">
              <span>Could not generate summary — {error}</span>
              <button onClick={loadSummary} className="underline hover:no-underline ml-2">
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-2.5">
              {/* Problem statement */}
              {data.problem && (
                <div className="flex gap-2.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5">Issue</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{data.problem}</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              {data.summary && (
                <div className="flex gap-2.5">
                  <Brain className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5">Summary</p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {/* strip markdown bold markers for clean display */}
                      {data.summary.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  </div>
                </div>
              )}

              {/* Suggested response */}
              {data.suggestedResponse && (
                <div className="flex gap-2.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5">Suggested reply</p>
                    <div className="bg-white border border-emerald-200 rounded-lg p-2.5 relative">
                      <p className="text-xs text-slate-700 leading-relaxed pr-16">{data.suggestedResponse}</p>
                      {onUseSuggestion && (
                        <button
                          onClick={handleUseSuggestion}
                          className="absolute top-2 right-2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />Use
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reload button */}
          {!loading && (
            <div className="flex justify-end pt-1">
              <button
                onClick={loadSummary}
                className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />Regenerate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
