"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { IndexItem } from "@/lib/professions/indexSchema";

interface RandomProfessionProps {
  locale: "en" | "es";
}

// Fisher-Yates shuffle to pick N random items
function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled.slice(0, count);
}

export function RandomProfession({ locale }: RandomProfessionProps) {
  const t = useTranslations("landing");
  const [professions, setProfessions] = useState<IndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRandomProfessions() {
      try {
        const response = await fetch("/data/professions.index.json");
        const data = await response.json();
        const items: IndexItem[] = data.items;

        // Pick 3 random professions
        const selected = pickRandom(items, 3);
        setProfessions(selected);
      } catch (error) {
        console.error("Failed to load professions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRandomProfessions();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 text-center">
          {t("random.label")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-6 h-32 border border-gray-200 dark:border-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  if (professions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 text-center">
        {t("random.label")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {professions.map((profession) => {
          const name = profession.name[locale] || profession.name.en;
          const slug = profession.slug[locale] || profession.slug.en;

          return (
            <Link
              key={profession.id}
              href={`/${locale}/p/${slug}`}
              className="group block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                {name}
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("random.cta")}
                </span>
                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
