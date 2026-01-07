import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@miniapps/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /static (static files)
    // - /data (data files for professions)
    // - /icon, /apple-icon, /manifest.webmanifest (PWA assets)
    // - /sw.js (service worker)
    // - files with extensions (e.g. favicon.ico)
    "/((?!api|_next|_vercel|static|data|icon|apple-icon|manifest\\.webmanifest|sw\\.js|.*\\..*).*)",
  ],
};
