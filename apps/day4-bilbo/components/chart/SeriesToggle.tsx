"use client";

import { useTranslations } from "next-intl";

interface SeriesToggleProps {
  value: string;
  options: Array<{ key: string; labelKey: string }>;
  onChange: (value: string) => void;
}

export function SeriesToggle({ value, options, onChange }: SeriesToggleProps) {
  const t = useTranslations();

  return (
    <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            value === option.key
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}

