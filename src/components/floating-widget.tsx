"use client";

import { useEffect } from "react";

interface FloatingWidgetProps {
  chatbotId: string;
  appUrl: string;
}

/**
 * Injects the SupportAI widget iframe on any page.
 * Uses the exact same mechanism as the public widget.js embed —
 * so it's identical to what external websites see.
 */
export function FloatingWidget({ chatbotId, appUrl }: FloatingWidgetProps) {
  useEffect(() => {
    // Don't double-inject
    if (document.getElementById("supportai-widget-iframe")) return;

    // Inject styles
    const style = document.createElement("style");
    style.id = "supportai-widget-style";
    style.textContent = `
      #supportai-widget-iframe {
        border: none;
        width: 420px;
        height: 640px;
        position: fixed;
        bottom: 0;
        right: 0;
        z-index: 2147483647;
        background: transparent;
        pointer-events: all;
      }
      @media (max-width: 480px) {
        #supportai-widget-iframe {
          width: 100vw;
          height: 100dvh;
          right: 0;
          bottom: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.id = "supportai-widget-iframe";
    iframe.src = `${appUrl}/widget/${encodeURIComponent(chatbotId)}`;
    iframe.setAttribute("title", "Support Chat");
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute("aria-label", "Support Chat Widget");
    document.body.appendChild(iframe);

    // Public API
    (window as unknown as Record<string, unknown>).SupportAI = {
      open:  () => iframe.contentWindow?.postMessage({ type: "SUPPORTAI_OPEN" },  "*"),
      close: () => iframe.contentWindow?.postMessage({ type: "SUPPORTAI_CLOSE" }, "*"),
    };

    return () => {
      // Cleanup on unmount (route change etc.)
      document.getElementById("supportai-widget-iframe")?.remove();
      document.getElementById("supportai-widget-style")?.remove();
    };
  }, [chatbotId, appUrl]);

  return null; // renders nothing — purely imperative DOM injection
}
