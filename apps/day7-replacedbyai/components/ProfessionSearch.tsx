"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  loadIndex,
  searchIndex,
  preloadIndex,
  type IndexItem,
} from "@/lib/professions/loadIndex.client";
import type { ThinIndex } from "@/lib/professions/indexSchema";
import { ProfessionRequestButton } from "./ProfessionRequestButton";
import { ProfessionRequestModal } from "./ProfessionRequestModal";

type Props = {
  locale: "en" | "es";
  professionCount: number;
};

export function ProfessionSearch({ locale, professionCount }: Props) {
  const t = useTranslations("landing.search");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Modal state lives here so it persists when dropdown closes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<ThinIndex | null>(null);

  // Preload index on mount
  useEffect(() => {
    preloadIndex();
    loadIndex()
      .then((index) => {
        indexRef.current = index;
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!indexRef.current || !query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const searchResults = searchIndex(indexRef.current, query, locale);
    setResults(searchResults);
    setSelectedIndex(-1);
  }, [query, locale]);

  const navigateToProfession = useCallback((slug: string) => {
    router.push(`/${locale}/p/${slug}`);
  }, [router, locale]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results.length) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            navigateToProfession(results[selectedIndex].slug[locale]);
          } else if (results.length > 0 && results[0]) {
            navigateToProfession(results[0].slug[locale]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsFocused(false);
          inputRef.current?.blur();
          break;
      }
    },
    [results, selectedIndex, locale, navigateToProfession]
  );

  const handleOpenRequestModal = (searchQuery: string) => {
    setModalQuery(searchQuery);
    setIsModalOpen(true);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const showResults = isFocused && query.trim().length > 0;

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on results
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="w-full px-5 py-4 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all"
          aria-label={t("placeholder")}
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls="search-results"
        />

        {/* Search icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          {isLoading ? (
            <svg
              className="w-6 h-6 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Hint text */}
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
        {t("hint", { count: professionCount })}
      </p>

      {/* Results dropdown */}
      {showResults && (
        <div
          id="search-results"
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto"
          role="listbox"
        >
          {results.length > 0 ? (
            results.map((item, index) => (
              <button
                key={item.id}
                onClick={() => navigateToProfession(item.slug[locale])}
                className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  index === selectedIndex
                    ? "bg-emerald-50 dark:bg-emerald-900/30"
                    : ""
                }`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.name[locale]}
                </div>
                {item.synonyms[locale].length > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.synonyms[locale].slice(0, 3).join(", ")}
                  </div>
                )}
              </button>
            ))
          ) : (
            <ProfessionRequestButton
              searchQuery={query}
              locale={locale}
              onRequestClick={handleOpenRequestModal}
            />
          )}
        </div>
      )}

      {/* Modal rendered outside dropdown so it doesn't unmount */}
      <ProfessionRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        searchQuery={modalQuery}
        locale={locale}
      />
    </div>
  );
}
