"use client";

import { memo } from "react";
import { LocaleSwitcher, ThemeToggle } from "@miniapps/ui";

// QR Icon SVG component
function QRIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Top-left finder pattern */}
      <rect x="2" y="2" width="3" height="3" rx="0.5" />
      <rect x="6" y="2" width="3" height="3" rx="0.5" />
      <rect x="2" y="6" width="3" height="3" rx="0.5" />
      <rect x="6" y="6" width="3" height="3" rx="0.5" />

      {/* Top-right area */}
      <rect x="19" y="2" width="3" height="3" rx="0.5" />
      <rect x="19" y="6" width="3" height="3" rx="0.5" />

      {/* Bottom-left area */}
      <rect x="2" y="19" width="3" height="3" rx="0.5" />
      <rect x="6" y="19" width="3" height="3" rx="0.5" />

      {/* Center and data pattern */}
      <rect x="11" y="11" width="2" height="2" rx="0.3" />
      <rect x="14" y="11" width="2" height="2" rx="0.3" />
      <rect x="17" y="11" width="2" height="2" rx="0.3" />
      <rect x="11" y="14" width="2" height="2" rx="0.3" />
      <rect x="14" y="14" width="2" height="2" rx="0.3" />
      <rect x="11" y="17" width="2" height="2" rx="0.3" />
      <rect x="17" y="17" width="2" height="2" rx="0.3" />
      <rect x="20" y="17" width="2" height="2" rx="0.3" />
      <rect x="17" y="20" width="2" height="2" rx="0.3" />
      <rect x="20" y="20" width="2" height="2" rx="0.3" />
    </svg>
  );
}

export const AppHeader = memo(function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        {/* Logo / Title with Icon */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500 p-1.5 text-white shadow-sm">
            <QRIcon className="w-full h-full" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            QRKit
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100/80 p-1 dark:bg-gray-800/50">
            <LocaleSwitcher />
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
});

