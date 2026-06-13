"use client";

import { useState } from "react";
import { Copy, Check, Code2, Globe, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface EmbedCodePanelProps {
  chatbotId: string;
  chatbotName: string;
  appUrl: string;
  widgetColor: string;
}

export function EmbedCodePanel({ chatbotId, chatbotName, appUrl, widgetColor }: EmbedCodePanelProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- ${chatbotName} - AI Support Widget -->
<script>
  window.SupportAIConfig = {
    chatbotId: "${chatbotId}",
    apiUrl: "${appUrl}"
  };
</script>
<script
  src="${appUrl}/widget.js"
  defer
></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Embed snippet */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              Embed Snippet
            </CardTitle>
            <Button onClick={handleCopy} size="sm" variant="outline" className="gap-2">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-sm overflow-x-auto leading-relaxed font-mono whitespace-pre">
            {embedCode}
          </pre>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            Installation Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Copy the embed snippet above.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>Paste it just before the closing <code className="bg-slate-100 px-1 rounded font-mono text-xs">&lt;/body&gt;</code> tag in your website&apos;s HTML.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>The chat widget will appear automatically as a floating button in the bottom-right corner.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <span>Works with any website — HTML, WordPress, Shopify, Webflow, etc.</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex gap-3 p-4 bg-emerald-50 border border-indigo-100 rounded-xl">
        <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-700">
          <p className="font-medium mb-0.5">Widget color: <span className="font-mono">{widgetColor}</span></p>
          <p className="text-emerald-600">The widget inherits the color and branding you configured. Update them anytime from the chatbot settings — changes reflect immediately.</p>
        </div>
      </div>
    </div>
  );
}
