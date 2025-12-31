"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "./utils";

interface ThemeToggleProps {
  className?: string;
}

const options = [
  { value: "light", icon: "☀️", title: "Light" },
  { value: "dark", icon: "🌙", title: "Dark" },
  { value: "system", icon: "💻", title: "System" },
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
        <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
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
            "rounded-md p-1.5 text-lg transition-all",
            theme === option.value ? "bg-gray-100 dark:bg-gray-800" : "opacity-50 hover:opacity-100"
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
