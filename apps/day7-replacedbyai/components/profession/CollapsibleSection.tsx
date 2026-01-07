"use client";

import { type ReactNode } from "react";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count?: number;
}

export function CollapsibleSection({
  id,
  title,
  subtitle,
  icon,
  children,
  isOpen,
  onToggle,
  count,
}: CollapsibleSectionProps) {

  return (
    <section id={id} className="mb-8 scroll-mt-24">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {title}
              {count !== undefined && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({count})
                </span>
              )}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          id={`${id}-content`}
          className="mt-4 animate-fadeIn"
        >
          {children}
        </div>
      )}
    </section>
  );
}

