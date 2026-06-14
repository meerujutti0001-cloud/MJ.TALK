"use client";

import { useState, useEffect } from "react";
import { WidgetApp } from "@/components/widget/widget-app";
import type { WidgetConfig } from "@/components/widget/widget-app";

interface FloatingWidgetProps {
  chatbotId: string;
}

/**
 * Renders the chat widget DIRECTLY in the page — no iframe needed.
 * Fetches the chatbot config client-side via /api/widget-config,
 * then mounts the full WidgetApp component inline.
 */
export function FloatingWidget({ chatbotId }: FloatingWidgetProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);

  useEffect(() => {
    if (!chatbotId) return;

    fetch(`/api/widget-config?chatbotId=${encodeURIComponent(chatbotId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.config && data.config.status === "active") {
          setConfig(data.config as WidgetConfig);
        }
      })
      .catch(() => {/* silently skip if fetch fails */});
  }, [chatbotId]);

  if (!config) return null;

  return <WidgetApp config={config} />;
}
