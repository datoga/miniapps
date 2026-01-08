"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@miniapps/analytics";

type Props = {
  searchQuery: string;
  locale: "en" | "es";
  onRequestClick: (query: string) => void;
};

export function ProfessionRequestButton({
  searchQuery,
  locale,
  onRequestClick,
}: Props) {
  const t = useTranslations("landing.search.request");
  const hasTracked = useRef(false);

  // Track when "not found" is shown (only once per search session)
  useEffect(() => {
    if (!hasTracked.current && searchQuery.trim()) {
      trackEvent("profession_not_found", {
        search_query: searchQuery,
        locale,
      });
      hasTracked.current = true;
    }
  }, [searchQuery, locale]);

  // Reset tracking when search query changes
  useEffect(() => {
    hasTracked.current = false;
  }, [searchQuery]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackEvent("profession_request_clicked", {
      search_query: searchQuery,
      locale,
    });
    onRequestClick(searchQuery);
  };

  return (
    <div className="px-4 py-8 text-center min-h-[120px]">
      <p className="text-gray-600 dark:text-gray-300">
        {t("notFound", { query: searchQuery })}
      </p>
      <button
        onClick={handleClick}
        onMouseDown={(e) => e.preventDefault()}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-violet-700 hover:to-indigo-700 transition-all hover:shadow-lg"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        {t("cta")}
      </button>
    </div>
  );
}
