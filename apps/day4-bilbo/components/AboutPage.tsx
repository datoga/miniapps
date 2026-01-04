"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Footer } from "@miniapps/ui";
import { LandingHeader } from "./LandingHeader";
import { trackOutboundClick } from "@/lib/ga";

interface AboutPageProps {
  locale: string;
}

const faqKeys = [
  "what1rm",
  "howSuggested",
  "whyNoChange1RM",
  "whatStrength",
  "howSync",
  "whatConflict",
  "privacy",
] as const;

export function AboutPage({ locale }: AboutPageProps) {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleOutboundClick = () => {
    trackOutboundClick("https://bilboteam.com/", "about_page");
  };

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <LandingHeader locale={locale} currentPath="about" />

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            {t("about.title")}
          </h1>

          <div className="space-y-8">
            <p className="text-lg text-gray-600 dark:text-gray-400">{t("about.description")}</p>

            {/* Method Section */}
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                {t("about.method.title")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{t("about.method.description")}</p>
            </section>

            {/* Privacy Section */}
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                {t("about.privacy.title")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{t("about.privacy.description")}</p>
            </section>

            {/* Attribution Section */}
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                {t("about.attribution.title")}
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {t("about.attribution.description")}
              </p>
              <a
                href="https://bilboteam.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOutboundClick}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                {t("about.attribution.link")}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                {t("faq.title")}
              </h2>
              <div className="space-y-3">
                {faqKeys.map((key, index) => (
                  <div
                    key={key}
                    className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t(`faq.questions.${key}.q`)}
                      </span>
                      <svg
                        className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform ${
                          openIndex === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {openIndex === index && (
                      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                        <p className="text-gray-600 dark:text-gray-400">
                          {t(`faq.questions.${key}.a`)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Disclaimer */}
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t("about.disclaimer")}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
