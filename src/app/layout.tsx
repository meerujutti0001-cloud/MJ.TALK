import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SSRPolyfill } from "@/components/ssr-polyfill";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MJ.TALK — Live Chat & AI Support for Modern Businesses",
  description:
    "MJ.TALK puts a live support agent or a smart AI bot in your customers' hands the moment they land on your site. Start free — no card needed.",
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: matchMediaPatch }} />
      </head>
      <body className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
        <SSRPolyfill />
        {children}
        <Toaster />
        {/* No global widget here.
            Landing page has its own LandingWidget (MJ.TALK Support).
            Dashboard has its own OrgWidget (user's org chatbot). */}
      </body>
    </html>
  );
}
