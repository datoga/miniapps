import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
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
    // - files with extensions (e.g. favicon.ico)
    "/((?!api|_next|_vercel|static|.*\\..*).*)",
  ],
};
