"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { t, tMany } from "../../lib/professions/translations";
import { CollapsibleSection } from "./CollapsibleSection";
import { getToolUrl, hasKnownUrl } from "../../lib/professions/toolLinks";

interface SignalsSectionProps {
  profession: Profession;
  id?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SignalsSection({ profession, id = "signals", isOpen = false, onToggle = () => {} }: SignalsSectionProps) {
  const locale = useLocale();
  const ui = useTranslations("profession");

  return (
    <CollapsibleSection
      id={id}
      title={ui("signals.title")}
      subtitle={ui("signals.subtitle")}
      icon="📡"
      count={profession.signalsAndTools.length}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid gap-4">
        {profession.signalsAndTools.map((signal, index) => {
          const signalDesc = t(signal.signalKey, locale);
          const whyItMatters = t(signal.whyItMattersKey, locale);
          const toolExamples = tMany(signal.toolExamplesKeys, locale);
          // Use English names for URL lookup (brand names stay same)
          const toolNamesEnglish = tMany(signal.toolExamplesKeys, "en");

          return (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {signalDesc}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {whyItMatters}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {toolExamples.map((tool, i) => {
                      const toolNameForUrl = toolNamesEnglish[i] || tool;
                      const url = getToolUrl(toolNameForUrl);
                      const isKnown = hasKnownUrl(toolNameForUrl);

                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                            isKnown
                              ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                              : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                          title={isKnown ? `${tool} - Official site` : `Search for ${tool}`}
                        >
                          {tool}
                          <svg
                            className="w-3 h-3 opacity-60"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
