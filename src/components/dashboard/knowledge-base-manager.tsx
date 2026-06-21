"use client";

import { useState } from "react";
import {
  BookOpen, Plus, Pencil, Trash2, Eye, EyeOff,
  Search, X, Loader2, Tag, ChevronDown, CheckCircle2,
  FileText, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { KbArticle } from "@/types";

const CATEGORIES: Array<{ value: KbArticle["category"]; label: string; color: string }> = [
  { value: "general",   label: "General",          color: "bg-slate-100 text-slate-600" },
  { value: "faq",       label: "FAQ",               color: "bg-blue-100 text-blue-700" },
  { value: "account",   label: "Account",           color: "bg-purple-100 text-purple-700" },
  { value: "payment",   label: "Payment",           color: "bg-emerald-100 text-emerald-700" },
  { value: "refund",    label: "Refund",            color: "bg-amber-100 text-amber-700" },
  { value: "technical", label: "Technical",         color: "bg-red-100 text-red-700" },
  { value: "setup",     label: "Setup / Onboarding",color: "bg-indigo-100 text-indigo-700" },
];

function categoryColor(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.color ?? "bg-slate-100 text-slate-600";
}
function categoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

interface ArticleFormData {
  title: string;
  content: string;
  category: KbArticle["category"];
  tags: string;
  isPublished: boolean;
}

const EMPTY_FORM: ArticleFormData = {
  title: "", content: "", category: "general", tags: "", isPublished: true,
};

interface Props {
  chatbotId: string;
  chatbotName: string;
  initialArticles: KbArticle[];
}

export function KnowledgeBaseManager({ chatbotId, chatbotName, initialArticles }: Props) {
  const [articles, setArticles] = useState<KbArticle[]>(initialArticles);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<KbArticle | null>(null);
  const [form, setForm]         = useState<ArticleFormData>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtered list ── */
  const filtered = articles.filter((a) => {
    const matchCat = catFilter === "all" || a.category === catFilter;
    const matchQ   = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  /* ── open new form ── */
  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  /* ── open edit form ── */
  function openEdit(article: KbArticle) {
    setEditing(article);
    setForm({
      title:       article.title,
      content:     article.content,
      category:    article.category,
      tags:        (article.tags ?? []).join(", "),
      isPublished: article.is_published,
    });
    setShowForm(true);
  }

  /* ── save (create or update) ── */
  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const tagsArray = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      if (editing) {
        const res = await fetch(`/api/knowledge-base/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title, content: form.content,
            category: form.category, tags: tagsArray,
            isPublished: form.isPublished,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
        const { article } = await res.json();
        setArticles((prev) => prev.map((a) => a.id === editing.id ? article : a));
        toast({ title: "Article updated" });
      } else {
        const res = await fetch("/api/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatbotId, title: form.title, content: form.content,
            category: form.category, tags: tagsArray,
            isPublished: form.isPublished,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
        const { article } = await res.json();
        setArticles((prev) => [article, ...prev]);
        toast({ title: "Article created" });
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  /* ── toggle published ── */
  async function togglePublished(article: KbArticle) {
    const res = await fetch(`/api/knowledge-base/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !article.is_published }),
    });
    if (res.ok) {
      const { article: updated } = await res.json();
      setArticles((prev) => prev.map((a) => a.id === article.id ? updated : a));
      toast({ title: updated.is_published ? "Article published" : "Article unpublished" });
    }
  }

  /* ── delete ── */
  async function handleDelete(id: string) {
    if (!confirm("Delete this article? It can't be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Article deleted" });
    } else {
      toast({ title: "Could not delete", variant: "destructive" });
    }
    setDeleting(null);
  }

  const publishedCount   = articles.filter((a) => a.is_published).length;
  const unpublishedCount = articles.length - publishedCount;

  return (
    <div className="space-y-5">

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Articles",   value: articles.length,   icon: FileText,    color: "text-slate-600",  bg: "bg-slate-50"  },
          { label: "Published",        value: publishedCount,    icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Draft / Hidden",   value: unpublishedCount,  icon: EyeOff,      color: "text-amber-600",  bg: "bg-amber-50"  },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="pl-8 h-9 text-sm border-slate-200 bg-slate-50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-9 w-44 text-sm border-slate-200">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-1.5">
          <Plus className="w-4 h-4" />
          New Article
        </Button>
      </div>

      {/* ── Article list ── */}
      {filtered.length === 0 ? (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">
              {articles.length === 0 ? `No articles for ${chatbotName} yet` : "No articles match your filter"}
            </p>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              {articles.length === 0
                ? "Add knowledge base articles so the AI can answer customer questions accurately."
                : "Try a different search or category."}
            </p>
            {articles.length === 0 && (
              <Button onClick={openNew} variant="outline" size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />Add first article
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => {
            const isExpanded = expandedId === article.id;
            return (
              <Card key={article.id} className={cn(
                "border transition-colors",
                article.is_published ? "border-slate-200" : "border-slate-200 bg-slate-50/50 opacity-75"
              )}>
                <CardContent className="p-0">
                  {/* Article header row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : article.id)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0 group"
                    >
                      <ChevronDown className={cn(
                        "w-4 h-4 text-slate-400 flex-shrink-0 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn(
                            "text-sm font-semibold truncate group-hover:text-emerald-700 transition-colors",
                            article.is_published ? "text-slate-800" : "text-slate-500"
                          )}>
                            {article.title}
                          </p>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", categoryColor(article.category))}>
                            {categoryLabel(article.category)}
                          </span>
                          {!article.is_published && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex-shrink-0 flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />Draft
                            </span>
                          )}
                        </div>
                        {!isExpanded && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {article.content.slice(0, 100)}{article.content.length > 100 ? "…" : ""}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => togglePublished(article)}
                        className={cn(
                          "h-7 w-7 flex items-center justify-center rounded-lg transition-colors",
                          article.is_published
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-slate-400 hover:bg-slate-100"
                        )}
                        title={article.is_published ? "Unpublish" : "Publish"}
                      >
                        {article.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(article)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={deleting === article.id}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Delete"
                      >
                        {deleting === article.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{article.content}</p>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {article.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Updated {new Date(article.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Article form modal ── */}
      {showForm && (
        <ArticleFormModal
          form={form}
          setForm={setForm}
          editing={editing}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }}
        />
      )}
    </div>
  );
}

/* ── Article Form Modal ── */
interface ArticleFormModalProps {
  form: ArticleFormData;
  setForm: React.Dispatch<React.SetStateAction<ArticleFormData>>;
  editing: KbArticle | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

const ARTICLE_TEMPLATES: Array<{ label: string; title: string; content: string; category: KbArticle["category"] }> = [
  {
    label: "Refund Policy",
    category: "refund",
    title: "Refund & Return Policy",
    content: "We offer a 30-day money-back guarantee on all purchases. To request a refund:\n\n1. Contact support with your order number\n2. Explain the reason for your refund request\n3. Refunds are processed within 5-7 business days\n\nNote: Digital products are non-refundable after download.",
  },
  {
    label: "Password Reset",
    category: "account",
    title: "How to Reset Your Password",
    content: "To reset your password:\n\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your inbox for a reset link (check spam if not received)\n5. Click the link and create a new password\n\nLinks expire after 1 hour. Contact support if you need further help.",
  },
  {
    label: "Common Error Fix",
    category: "technical",
    title: "Troubleshooting Common Errors",
    content: "If you're experiencing errors, try these steps first:\n\n1. Clear your browser cache and cookies\n2. Try a different browser or incognito mode\n3. Check your internet connection\n4. Disable browser extensions temporarily\n5. Refresh the page\n\nIf the issue persists, please contact our support team with a screenshot of the error.",
  },
  {
    label: "Billing FAQ",
    category: "payment",
    title: "Billing & Subscription FAQ",
    content: "**When am I charged?**\nSubscriptions are billed on the same day each month/year.\n\n**How do I cancel?**\nGo to Settings → Billing → Cancel Subscription. You retain access until the end of your billing period.\n\n**Can I change my plan?**\nYes, upgrades take effect immediately. Downgrades apply at next renewal.\n\n**Where is my invoice?**\nInvoices are emailed automatically and available in Settings → Billing.",
  },
];

function ArticleFormModal({ form, setForm, editing, saving, onSave, onClose }: ArticleFormModalProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  function applyTemplate(t: typeof ARTICLE_TEMPLATES[0]) {
    setForm((p) => ({ ...p, title: t.title, content: t.content, category: t.category }));
    setShowTemplates(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              {editing ? "Edit Article" : "New Article"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              This content is injected into the AI context when relevant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates((s) => !s)}
                className="gap-1.5 text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Templates
              </Button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Templates dropdown */}
        {showTemplates && (
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <p className="text-xs font-semibold text-slate-500 mb-2">Quick-start templates</p>
            <div className="flex flex-wrap gap-2">
              {ARTICLE_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 font-medium transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. How to reset your password"
              className="border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Category *</label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as KbArticle["category"] }))}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tags</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="login, password, access"
                className="border-slate-200 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Content *</label>
              <span className="text-xs text-slate-400">{form.content.length} chars</span>
            </div>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="Write the article content here. Be clear and specific — the AI will use this to answer customer questions."
              className="min-h-[200px] resize-y border-slate-200 text-sm leading-relaxed"
            />
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-700">Published</p>
              <p className="text-xs text-slate-400 mt-0.5">Unpublished articles are not used by the AI.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isPublished: !p.isPublished }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                form.isPublished ? "bg-emerald-500" : "bg-slate-300"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                form.isPublished ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* AI usage tip */}
          <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Tip:</span> Keep content factual and specific. The AI scores relevance by keyword matching, so include the exact terms customers might use (e.g. &quot;refund&quot;, &quot;password reset&quot;, &quot;error code&quot;).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={onSave}
            disabled={!form.title.trim() || !form.content.trim() || saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><CheckCircle2 className="w-4 h-4" />{editing ? "Save Changes" : "Create Article"}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
