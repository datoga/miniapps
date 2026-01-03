/**
 * App configuration
 * Uses environment variables when available, falls back to defaults
 */

export const APP_NAME = "QRKit";

/**
 * Get the app URL from environment or use default
 * Priority: NEXT_PUBLIC_APP_URL > VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL > default
 */
function getAppUrl(): string {
  // Explicit app URL (highest priority)
  if (process.env["NEXT_PUBLIC_APP_URL"]) {
    return process.env["NEXT_PUBLIC_APP_URL"];
  }

  // Vercel production URL
  if (process.env["VERCEL_PROJECT_PRODUCTION_URL"]) {
    return `https://${process.env["VERCEL_PROJECT_PRODUCTION_URL"]}`;
  }

  // Vercel preview URL
  if (process.env["VERCEL_URL"]) {
    return `https://${process.env["VERCEL_URL"]}`;
  }

  // Default fallback
  return "https://qrkit.pro";
}

export const APP_URL = getAppUrl();

