import { defaultLocale, locales } from "@miniapps/i18n";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

/**
 * Normalize accented characters in profession slugs.
 * Users type "/es/p/auxiliar-de-enfermería" but the slug is "auxiliar-de-enfermeria".
 */
function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite root "/" to default locale instead of redirecting (SEO: avoids 307)
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.rewrite(url);
  }

  // Check if this is a profession page with accented characters
  if (/^\/(?:es|en)\/p\//.test(pathname)) {
    const normalized = stripAccents(pathname);
    if (normalized !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = normalized;
      return NextResponse.redirect(url, 301);
    }
  }

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
    // - /og-image.png (OG image)
    // - /sitemap.xml, /robots.txt (SEO files)
    // - files with extensions (e.g. favicon.ico)
    "/((?!api|_next|_vercel|static|data|icon|apple-icon|manifest\\.webmanifest|sw\\.js|og-image\\.png|sitemap\\.xml|robots\\.txt|.*\\..*).*)",
  ],
};
