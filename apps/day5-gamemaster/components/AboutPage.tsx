"use client";

import { useTranslations } from "next-intl";
import { Footer } from "@miniapps/ui";
import { AppHeader } from "./AppHeader";

interface AboutPageProps {
  locale: string;
}

export function AboutPage({ locale }: AboutPageProps) {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <AppHeader locale={locale} currentPath="about" />

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">🏆</div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {t("about.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("about.description")}
            </p>
          </div>

          {/* Features */}
          <section className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t("about.features.title")}
            </h2>
            <ul className="space-y-2">
              {(t.raw("about.features.list") as string[]).map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Privacy */}
          <section className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t("about.privacy.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {t("about.privacy.description")}
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

