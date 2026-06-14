import type { ReactNode } from "react";

/**
 * Widget iframe layout — transparent background so only the
 * floating button/chat window show. No headers, no padding.
 */
export default function WidgetLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            background: transparent !important;
            overflow: hidden;
            height: 100%;
            width: 100%;
          }
          /* Tailwind base resets background — override it */
          body { background-color: transparent !important; }
        `}</style>
      </head>
      <body style={{ background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
