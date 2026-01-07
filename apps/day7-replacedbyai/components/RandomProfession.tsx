"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { IndexItem } from "@/lib/professions/indexSchema";

interface RandomProfessionProps {
  locale: "en" | "es";
}

export function RandomProfession({ locale }: RandomProfessionProps) {
  const t = useTranslations("landing");
  const [profession, setProfession] = useState<IndexItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRandomProfession() {
      try {
        const response = await fetch("/data/professions.index.json");
        const data = await response.json();
        const items: IndexItem[] = data.items;

        // Pick a random profession
        const randomIndex = Math.floor(Math.random() * items.length);
        const selected = items[randomIndex];
        if (selected) {
          setProfession(selected);
        }
      } catch (error) {
        console.error("Failed to load professions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRandomProfession();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-6 h-32 border border-gray-200 dark:border-gray-700" />
    );
  }

  if (!profession) {
    return null;
  }

  const name = profession.name[locale] || profession.name.en;
  const slug = profession.slug[locale] || profession.slug.en;

  return (
    <Link
      href={`/${locale}/p/${slug}`}
      className="group block bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700"
    >
      <div className="mb-4">
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {t("random.label")}
        </span>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {name}
      </h3>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">
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
}

