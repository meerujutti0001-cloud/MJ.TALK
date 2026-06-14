import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SSRPolyfill } from "@/components/ssr-polyfill";
import { FloatingWidget } from "@/components/floating-widget";
import { createServiceClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MJ.TALK — Live Chat & AI Support for Modern Businesses",
  description:
    "MJ.TALK puts a live support agent or a smart AI bot in your customers' hands the moment they land on your site. Start free — no card needed.",
};

// Runs synchronously before ANY script — patches matchMedia.addListener
const matchMediaPatch = `
(function(){
  if(typeof window==='undefined'||!window.matchMedia)return;
  var orig=window.matchMedia.bind(window);
  window.matchMedia=function(q){
    var r=orig(q);
    if(!r)return r;
    if(typeof r.addListener!=='function'){
      try{
        Object.defineProperty(r,'addListener',{configurable:true,writable:true,value:function(cb){this.addEventListener('change',cb);}});
        Object.defineProperty(r,'removeListener',{configurable:true,writable:true,value:function(cb){this.removeEventListener('change',cb);}});
      }catch(e){}
    }
    return r;
  };
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Priority: explicit env var → first active chatbot in DB → nothing (widget hidden)
  let widgetChatbotId: string | null = process.env.NEXT_PUBLIC_DEMO_CHATBOT_ID?.trim() || null;

  if (!widgetChatbotId) {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("chatbots")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();           // maybeSingle → returns null instead of error when no rows

      if (!error && data?.id) {
        widgetChatbotId = data.id;
      }
    } catch {
      // DB not reachable — skip widget silently
    }
  }

  // Safety: never render the widget with a blank/falsy ID
  const showWidget = !!widgetChatbotId && widgetChatbotId.length > 10;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Patch matchMedia.addListener before any component runs */}
        <script dangerouslySetInnerHTML={{ __html: matchMediaPatch }} />
      </head>
      <body className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
        <SSRPolyfill />
        {children}
        <Toaster />
        {/* Floating AI assistant — shown on every page when a chatbot exists */}
        {showWidget && (
          <FloatingWidget chatbotId={widgetChatbotId!} />
        )}
      </body>
    </html>
  );
}
