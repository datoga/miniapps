"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";

const locales = ["es", "en"] as const;
type Locale = (typeof locales)[number];

const localeLabels: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};

interface ProfessionLocaleSwitcherProps {
  slugs: {
    en: string;
    es: string;
  };
}

export const ProfessionLocaleSwitcher = memo(function ProfessionLocaleSwitcher({
  slugs
}: ProfessionLocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      const newSlug = slugs[newLocale];
      const newPath = `/${newLocale}/p/${newSlug}`;
      router.push(newPath);
    },
    [slugs, router]
  );

  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-8 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            locale === loc
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
          title={loc.toUpperCase()}
          type="button"
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
});

