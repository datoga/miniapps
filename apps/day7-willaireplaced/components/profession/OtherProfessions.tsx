"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { IndexItem } from "../../lib/professions/indexSchema";

interface OtherProfessionsProps {
  locale: "en" | "es";
  currentSlug: string;
}

export function OtherProfessions({ locale, currentSlug }: OtherProfessionsProps) {
  const t = useTranslations("profession");
  const [professions, setProfessions] = useState<IndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRandomProfessions() {
      try {
        const response = await fetch("/data/professions.index.json");
        const data = await response.json();
        const items: IndexItem[] = data.items;

        // Filter out current profession and shuffle
        const otherItems = items.filter(
          (item) => item.slug[locale] !== currentSlug && item.slug.en !== currentSlug
        );

        // Shuffle and take 3
        const shuffled = otherItems.sort(() => Math.random() - 0.5);
        setProfessions(shuffled.slice(0, 3));
      } catch (error) {
        console.error("Failed to load professions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRandomProfessions();
  }, [locale, currentSlug]);

  if (isLoading) {
    return (
      <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {t("otherProfessions")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl h-24"
            />
          ))}
        </div>
      </section>
    );
  }

  if (professions.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
        <span>🔍</span>
        {t("otherProfessions")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {professions.map((profession) => {
          const name = profession.name[locale] || profession.name.en;
          const slug = profession.slug[locale] || profession.slug.en;

          return (
            <Link
              key={profession.id}
              href={`/${locale}/p/${slug}`}
              className="group block bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {name}
              </h3>
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{t("viewMore")}</span>
                <svg
                  className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

