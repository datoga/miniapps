import { defaultLocale, locales } from "@miniapps/i18n";
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true, // Detect browser's Accept-Language header
});

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
