"use client";

import { useTranslations } from "next-intl";
import { ThemeToggle, LocaleSwitcher } from "@miniapps/ui";
import { memo } from "react";

interface AppHeaderProps {
  onSettingsClick: () => void;
  settingsDisabled: boolean;
  onHomeClick?: () => void;
}

export const AppHeader = memo(function AppHeader({
  onSettingsClick,
  settingsDisabled,
  onHomeClick,
}: AppHeaderProps) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        {/* Logo / Title - clickable to go home */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="text-xl">🎥</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {t("app.title")}
          </span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Settings button */}
          <button
            onClick={onSettingsClick}
            disabled={settingsDisabled}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            title={t("nav.settings")}
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Locale and Theme */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100/80 p-1 dark:bg-gray-800/50">
            <LocaleSwitcher disabled={settingsDisabled} />
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
});

