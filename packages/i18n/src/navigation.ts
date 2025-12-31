import { locales, type Locale } from "./locales";

/**
 * Get the pathname without the locale prefix
 */
export function getPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
    return "/" + segments.slice(1).join("/");
  }
  return pathname;
}

/**
 * Get the localized pathname for a given locale
 */
export function getLocalizedPathname(pathname: string, locale: Locale): string {
  const cleanPath = getPathname(pathname);
  const normalizedPath = cleanPath === "/" ? "" : cleanPath;
  return `/${locale}${normalizedPath}`;
}
