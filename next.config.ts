import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Widget iframe — allow embedding from any origin, transparent background
        source: "/widget/:path*",
        headers: [
          { key: "X-Frame-Options",              value: "ALLOWALL" },
          { key: "Content-Security-Policy",       value: "frame-ancestors *" },
          // No-cache so the widget always gets fresh chatbot config
          { key: "Cache-Control",                 value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
