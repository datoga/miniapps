"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ThemeToggle, LocaleSwitcher } from "@miniapps/ui";
import { trackNavClick } from "@/lib/ga";

interface LandingHeaderProps {
  locale: string;
  currentPath?: "landing" | "about";
}

export function LandingHeader({ locale, currentPath = "landing" }: LandingHeaderProps) {
  const t = useTranslations();

  const handleNavClick = (destination: string) => {
    trackNavClick(destination, "landing_header");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"
        >
          <span className="text-xl">🏋️</span>
          <span className="hidden xs:inline">{t("app.title")}</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Navigation icons */}
          <nav className="flex items-center">
            {/* App/Dashboard button */}
            <Link
              href={`/${locale}/app`}
              onClick={() => handleNavClick("app")}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title={t("nav.app")}
            >
              {/* Grid/Dashboard icon */}
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </Link>

            {/* About button - only when not on about */}
            {currentPath !== "about" && (
              <Link
                href={`/${locale}/about`}
                onClick={() => handleNavClick("about")}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title={t("nav.about")}
              >
                {/* Info icon */}
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Link>
            )}
          </nav>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
