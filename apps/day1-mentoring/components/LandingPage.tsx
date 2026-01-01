"use client";

import { memo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@miniapps/ui";

export const LandingPage = memo(function LandingPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const handleEnterApp = useCallback(() => {
    router.push(`/${locale}/dashboard`);
  }, [router, locale]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-accent-50/30 dark:from-primary-950/20 dark:via-transparent dark:to-accent-950/10" />

      {/* Decorative circles */}
      <div className="absolute top-20 -left-32 w-64 h-64 bg-primary-200/20 dark:bg-primary-800/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-80 h-80 bg-accent-200/20 dark:bg-accent-800/10 rounded-full blur-3xl" />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            {t("app.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
            {t("app.description")}
          </p>

          {/* Features - minimal */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-500">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              {t("landing.feature1Title")}
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-500">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {t("landing.feature2Title")}
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {t("landing.feature3Title")}
            </span>
          </div>

          {/* CTA */}
          <Button type="button" size="lg" onClick={handleEnterApp} className="px-8 shadow-lg shadow-primary-500/20">
            {t("landing.cta")}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Button>

          {/* Privacy note */}
          <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {t("landing.privacyNote")}
          </p>
        </div>
      </section>
    </div>
  );
});
