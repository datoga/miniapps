"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

interface AddCardProps {
  onClick: () => void;
}

export const AddCard = memo(function AddCard({ onClick }: AddCardProps) {
  const t = useTranslations();

  return (
    <button
      onClick={onClick}
      className="group relative min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 bg-white/30 dark:bg-gray-900/30 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="mb-3 w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-400 group-hover:text-primary-500 transition-colors"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {t("library.addNew")}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {t("library.addNewDesc")}
      </p>
    </button>
  );
});

