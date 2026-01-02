"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

export const AppFooter = memo(function AppFooter() {
  const currentYear = new Date().getFullYear();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSetTheme = useCallback(
    (newTheme: string) => {
      setTheme(newTheme);
    },
    [setTheme]
  );

  const getButtonClass = (buttonTheme: string) => {
    const base = "p-2 rounded-lg transition-all";
    if (!mounted) {return `${base} text-slate-400`;}

    if (theme === buttonTheme) {
      return `${base} text-indigo-500 dark:text-indigo-400`;
    }
    return `${base} text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`;
  };

  return (
    <footer className="mt-8 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          © {currentYear} |{" "}
          <a
            href="https://datoga.es/contacto/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-indigo-500"
          >
            datoga.es
          </a>
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSetTheme("light")}
            className={getButtonClass("light")}
            title="Light theme"
          >
            <SunIcon />
          </button>
          <button
            type="button"
            onClick={() => handleSetTheme("dark")}
            className={getButtonClass("dark")}
            title="Dark theme"
          >
            <MoonIcon />
          </button>
          <button
            type="button"
            onClick={() => handleSetTheme("system")}
            className={getButtonClass("system")}
            title="System theme"
          >
            <SystemIcon />
          </button>
        </div>
      </div>
    </footer>
  );
});
