/**
 * Returns the canonical app URL for use in server-side code.
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL env var (set this in Vercel)
 * 2. VERCEL_URL (auto-set by Vercel on every deployment)
 * 3. Fallback to production URL
 *
 * Never returns a string with "undefined" in it.
 */
export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl !== "undefined" && envUrl.startsWith("http")) {
    return envUrl.replace(/\/$/, "");
  }

  // Vercel sets this automatically on every deployment
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl !== "undefined") {
    return `https://${vercelUrl}`.replace(/\/$/, "");
  }

  // Final fallback
  return "https://mj-talk.vercel.app";
}
