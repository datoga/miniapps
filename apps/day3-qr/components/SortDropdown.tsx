"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { SortBy, SortDir } from "../lib/types";

interface SortDropdownProps {
  sortBy: SortBy;
  sortDir: SortDir;
  onSortChange: (sortBy: SortBy, sortDir: SortDir) => void;
}

export const SortDropdown = memo(function SortDropdown({
  sortBy,
  sortDir,
  onSortChange,
}: SortDropdownProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (newSortBy: SortBy) => {
      if (sortBy === newSortBy) {
        // Toggle direction
        onSortChange(newSortBy, sortDir === "asc" ? "desc" : "asc");
      } else {
        // New sort field - default directions
        onSortChange(newSortBy, newSortBy === "createdAt" ? "desc" : "asc");
      }
      setIsOpen(false);
    },
    [sortBy, sortDir, onSortChange]
  );

  const currentLabel = sortBy === "name" ? t("library.sortByName") : t("library.sortByDate");

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
      >
        {/* Sort icon - changes based on current sort */}
        {sortBy === "createdAt" ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l4 2" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <path d="M4 6h16M4 12h10M4 18h4" />
          </svg>
        )}
        <span className="text-sm font-medium hidden sm:inline">{currentLabel}</span>
        {/* Direction arrow */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`}
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
          <button
            onClick={() => handleSelect("name")}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
              sortBy === "name"
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6h16M4 12h10M4 18h4" />
              </svg>
              <span className="font-medium">{t("library.sortByName")}</span>
            </div>
            {sortBy === "name" && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={sortDir === "asc" ? "rotate-180" : ""}
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => handleSelect("createdAt")}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
              sortBy === "createdAt"
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="font-medium">{t("library.sortByDate")}</span>
            </div>
            {sortBy === "createdAt" && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={sortDir === "asc" ? "rotate-180" : ""}
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
});
