"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ThemeToggle, LocaleSwitcher } from "@miniapps/ui";
import { trackNavClick } from "@/lib/ga";

interface AppHeaderProps {
  locale: string;
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  rightContent?: React.ReactNode;
  currentPath?: "landing" | "app" | "about" | "settings" | "tournament";
}

export function AppHeader({
  locale,
  showBackButton = false,
  backHref,
  title,
  rightContent,
  currentPath = "app",
}: AppHeaderProps) {
  const t = useTranslations();

  const handleNavClick = (destination: string) => {
    trackNavClick(destination, "app_header");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBackButton && backHref && (
            <Link
              href={backHref}
              onClick={() => handleNavClick("back")}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          )}
          {!showBackButton && (
            <Link
              href={`/${locale}`}
              onClick={() => handleNavClick("landing")}
              className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"
            >
              <span className="text-xl">🏆</span>
              <span className="hidden sm:inline">{t("app.title")}</span>
            </Link>
          )}
          {title && (
            <span className="hidden font-semibold text-gray-900 sm:inline dark:text-white">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Navigation icons */}
          <nav className="flex items-center">
            {/* App/Home button - shown when on about or settings */}
            {(currentPath === "about" || currentPath === "settings") && (
              <Link
                href={`/${locale}/app`}
                onClick={() => handleNavClick("app")}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                title={t("nav.dashboard")}
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
            )}
            {/* About button - shown when not on about or landing */}
            {currentPath !== "about" && currentPath !== "landing" && (
              <Link
                href={`/${locale}/about`}
                onClick={() => handleNavClick("about")}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
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
          {rightContent}
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
