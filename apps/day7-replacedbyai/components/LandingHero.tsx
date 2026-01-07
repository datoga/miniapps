"use client";

import { useTranslations } from "next-intl";

export function LandingHero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden pt-16 pb-8 sm:pt-24 sm:pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto text-center">
        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 dark:from-emerald-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {t("heading")}
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-200 mb-6 font-medium">
          {t("subheading")}
        </p>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          {t("description")}
        </p>

        {/* Scroll indicator */}
        <div className="mt-8 animate-bounce">
          <svg
            className="w-6 h-6 mx-auto text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}


