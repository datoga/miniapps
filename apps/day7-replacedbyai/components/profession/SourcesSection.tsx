"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { t } from "../../lib/professions/translations";
import { CollapsibleSection } from "./CollapsibleSection";

interface SourcesSectionProps {
  profession: Profession;
  id?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SourcesSection({ profession, id = "sources", isOpen = false, onToggle = () => {} }: SourcesSectionProps) {
  const locale = useLocale();
  const ui = useTranslations("profession");

  return (
    <CollapsibleSection
      id={id}
      title={ui("sources.title")}
      subtitle={ui("sources.subtitle")}
      icon="📚"
      count={profession.sources.length}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <ul className="space-y-4">
          {profession.sources.map((source, index) => {
            const note = t(source.noteKey, locale);

            return (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline break-words"
                  >
                    {source.title}
                  </a>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {source.publisher} • {source.year}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                    {note}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </CollapsibleSection>
  );
}
