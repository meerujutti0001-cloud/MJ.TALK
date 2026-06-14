import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // React strict mode for better performance checks
  reactStrictMode: true,
  
  // Optimize CSS
  optimizeCss: true,
  
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
      {
        // Static assets - aggressive caching
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // API routes - no cache
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
