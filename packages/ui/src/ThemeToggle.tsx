"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "./utils";

interface ThemeToggleProps {
  className?: string;
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const options = [
  { value: "light", icon: <SunIcon />, title: "Light" },
  { value: "dark", icon: <MoonIcon />, title: "Dark" },
  { value: "system", icon: <MonitorIcon />, title: "System" },
] as const;

export const ThemeToggle = memo(function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = useCallback(
    (value: string) => {
      setTheme(value);
    },
    [setTheme]
  );

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleThemeChange(option.value)}
          className={cn(
            "rounded-md p-1.5 transition-all text-gray-600 dark:text-gray-400",
            theme === option.value ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "opacity-50 hover:opacity-100"
          )}
          title={option.title}
          type="button"
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
});
