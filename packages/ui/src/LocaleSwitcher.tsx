"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import { cn } from "./utils";

const locales = ["es", "en"] as const;
type Locale = (typeof locales)[number];

const localeLabels: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};

interface LocaleSwitcherProps {
  className?: string;
  disabled?: boolean;
}

export const LocaleSwitcher = memo(function LocaleSwitcher({ className, disabled }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      const segments = pathname.split("/").filter(Boolean);
      if (locales.includes(segments[0] as Locale)) {
        segments[0] = newLocale;
      } else {
        segments.unshift(newLocale);
      }
      const newPath = "/" + segments.join("/");
      router.push(newPath);
    },
    [pathname, router]
  );

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="h-8 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", disabled && "opacity-50", className)}>
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={disabled}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
            locale === loc
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            disabled && "cursor-not-allowed"
          )}
          title={loc.toUpperCase()}
          type="button"
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
});
