import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@miniapps/i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /static (static files)
    // - /icon, /apple-icon, /manifest.webmanifest (PWA assets)
    // - /og-image.png (OG image)
    // - /sitemap.xml, /robots.txt (SEO files)
    // - files with extensions (e.g. favicon.ico)
    "/((?!api|_next|_vercel|static|icon|apple-icon|manifest\\.webmanifest|og-image\\.png|sitemap\\.xml|robots\\.txt|.*\\..*).*)",
  ],
};

