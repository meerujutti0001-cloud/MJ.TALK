"use client";

import { useEffect } from "react";

interface FloatingWidgetProps {
  chatbotId: string;
}

export function FloatingWidget({ chatbotId }: FloatingWidgetProps) {
  useEffect(() => {
    if (!chatbotId || chatbotId.length < 10) return;
    if (document.getElementById("supportai-widget-iframe")) return;

    const origin = window.location.origin;

    const style = document.createElement("style");
    style.id = "supportai-widget-style";
    style.textContent = `
      #supportai-widget-iframe {
        border: none !important;
        outline: none !important;
        background: transparent !important;
        /* Full viewport so the floating button inside can position itself */
        position: fixed !important;
        bottom: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        /* Sit on top of everything */
        z-index: 2147483647 !important;
        /* Let clicks pass through the transparent parts */
        pointer-events: none !important;
        /* No box, no shadow */
        box-shadow: none !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);

    const iframe = document.createElement("iframe");
    iframe.id = "supportai-widget-iframe";
    iframe.src = `${origin}/widget/${encodeURIComponent(chatbotId)}`;
    iframe.setAttribute("title", "Support Chat");
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute("aria-label", "Support Chat Widget");
    // Start hidden — becomes visible only after it loads successfully
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    iframe.onload = () => {
      // Only show if it loaded a real page (not a 404)
      try {
        // If we can access contentDocument, check for error indicators
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const body = doc?.body?.textContent ?? "";
        // Next.js 404 page contains "404" and "not found" in the body text
        if (body.toLowerCase().includes("404") || body.toLowerCase().includes("not found")) {
          // Silently remove — chatbot not found or inactive
          iframe.remove();
          style.remove();
          return;
        }
      } catch {
        // Cross-origin check failed — assume it loaded fine (same-origin should work)
      }
      // Widget loaded — make it interactive
      iframe.style.opacity = "1";
      iframe.style.pointerEvents = "none"; // still passthrough on the iframe itself
    };

    document.body.appendChild(iframe);

    (window as unknown as Record<string, unknown>).SupportAI = {
      open:  () => iframe.contentWindow?.postMessage({ type: "SUPPORTAI_OPEN" },  "*"),
      close: () => iframe.contentWindow?.postMessage({ type: "SUPPORTAI_CLOSE" }, "*"),
    };

    // Forward pointer events — the widget button inside needs clicks
    // We toggle pointer-events to "all" on the iframe only when the user
    // interacts with the bottom-right corner where the button lives
    const BUTTON_SIZE = 80; // px — generous hit zone for the launcher
    const handleMouseMove = (e: MouseEvent) => {
      const fromRight  = window.innerWidth  - e.clientX;
      const fromBottom = window.innerHeight - e.clientY;
      // Enable pointer events in the bottom-right 400×650 zone (widget area)
      iframe.style.pointerEvents =
        (fromRight < 400 && fromBottom < 650) ? "all" : "none";
    };
    document.addEventListener("mousemove", handleMouseMove);

    // Touch support — always enable on touch start (mobile)
    const handleTouchStart = () => { iframe.style.pointerEvents = "all"; };
    const handleTouchEnd   = () => { iframe.style.pointerEvents = "none"; };
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend",   handleTouchEnd);

    return () => {
      document.getElementById("supportai-widget-iframe")?.remove();
      document.getElementById("supportai-widget-style")?.remove();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend",   handleTouchEnd);
    };
  }, [chatbotId]);

  return null;
}
