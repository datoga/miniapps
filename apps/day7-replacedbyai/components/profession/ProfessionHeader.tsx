"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { t, tMany } from "../../lib/professions/translations";
import { ShareButton } from "./ShareButton";

interface ProfessionHeaderProps {
  profession: Profession;
}

export function ProfessionHeader({ profession }: ProfessionHeaderProps) {
  const locale = useLocale();
  const ui = useTranslations("profession");

  const loc = locale as "en" | "es";
  const name = profession.name[loc] || profession.name.en;
  const slug = profession.slug[loc] || profession.slug.en;
  const synonyms = profession.synonyms[loc] || profession.synonyms.en;
  const oneLiner = t(profession.oneLinerKey, locale);
  const summaryBullets = tMany(profession.summaryBulletsKeys, locale);

  return (
    <header id="summary" className="mb-12 scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {name}
        </h1>
        <ShareButton professionName={name} slug={slug} />
      </div>

      {/* Synonyms */}
      <div className="flex flex-wrap gap-2 mb-6">
        {synonyms.map((synonym, index) => (
          <span
            key={index}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"
          >
            {synonym}
          </span>
        ))}
      </div>

      {/* One-liner */}
      <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
        {oneLiner}
      </p>

      {/* Summary bullets */}
      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {ui("keyTakeaways")}
        </h2>
        <ul className="space-y-3">
          {summaryBullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
