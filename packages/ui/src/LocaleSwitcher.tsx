"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "./utils";

const locales = ["es", "en"] as const;
type Locale = (typeof locales)[number];

const flags: Record<Locale, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
};

interface LocaleSwitcherProps {
  className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split("/").filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    const newPath = "/" + segments.join("/");
    router.push(newPath);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={cn(
            "rounded-md p-1.5 text-xl transition-all",
            locale === loc
              ? "bg-gray-100 dark:bg-gray-800"
              : "opacity-50 hover:opacity-100"
          )}
          title={loc.toUpperCase()}
        >
          {flags[loc]}
        </button>
      ))}
    </div>
  );
}
