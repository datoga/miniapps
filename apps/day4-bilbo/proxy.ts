import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@miniapps/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export function proxy(request: Request) {
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|static|.*\\..*).*)" ],
};
