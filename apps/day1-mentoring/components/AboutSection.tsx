"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = memo(function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 py-4 last:border-0">
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{question}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
    </div>
  );
});

export const AboutSection = memo(function AboutSection() {
  const t = useTranslations("about");

  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-600 dark:text-primary-400">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
          {t("title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          {t("description")}
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 dark:text-green-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t("feature1Title")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("feature1Desc")}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t("feature2Title")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("feature2Desc")}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600 dark:text-purple-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t("feature3Title")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("feature3Desc")}</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("faqTitle")}</h3>
        <div>
          <FAQItem question={t("faq1Question")} answer={t("faq1Answer")} />
          <FAQItem question={t("faq2Question")} answer={t("faq2Answer")} />
          <FAQItem question={t("faq3Question")} answer={t("faq3Answer")} />
          <FAQItem question={t("faq4Question")} answer={t("faq4Answer")} />
        </div>
      </div>

      {/* Version */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
        MentorFlow v1.0 — {t("madeWith")}
      </p>
    </section>
  );
});

