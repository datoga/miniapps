"use client";

import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("landing.about");
  const levels = useTranslations("landing.automationLevels");

  return (
    <section
      id="about"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-100 dark:from-gray-950 dark:to-gray-900"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {t("title")}
        </h2>

        <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-emerald-600 dark:first-letter:text-emerald-400 first-letter:float-left first-letter:mr-2">
            {t("p1")}
          </p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>

        {/* Visual explanation of automation levels */}
        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {levels("title")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="automation-assist px-3 py-1 rounded-full text-sm font-medium">
                {levels("assist.name")}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {levels("assist.description")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="automation-partial px-3 py-1 rounded-full text-sm font-medium">
                {levels("partial.name")}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {levels("partial.description")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="automation-majority px-3 py-1 rounded-full text-sm font-medium">
                {levels("majority.name")}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {levels("majority.description")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="automation-total px-3 py-1 rounded-full text-sm font-medium">
                {levels("total.name")}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {levels("total.description")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
