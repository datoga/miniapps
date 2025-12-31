"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "./utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const options = [
    { value: "light", icon: "☀️", title: "Light" },
    { value: "dark", icon: "🌙", title: "Dark" },
    { value: "system", icon: "💻", title: "System" },
  ];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            "rounded-md p-1.5 text-lg transition-all",
            theme === option.value ? "bg-gray-100 dark:bg-gray-800" : "opacity-50 hover:opacity-100"
          )}
          title={option.title}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
