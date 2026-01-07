"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { tMany } from "../../lib/professions/translations";
import { CollapsibleSection } from "./CollapsibleSection";

interface NotesSectionProps {
  profession: Profession;
  id?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function NotesSection({ profession, id = "notes", isOpen = false, onToggle = () => {} }: NotesSectionProps) {
  const locale = useLocale();
  const ui = useTranslations("profession");

  const assumptions = tMany(profession.notes.assumptionsKeys, locale);
  const scopeBoundaries = tMany(profession.notes.scopeBoundariesKeys, locale);

  return (
    <CollapsibleSection
      id={id}
      title={ui("notes.title")}
      icon="📝"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Assumptions */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {ui("notes.assumptions")}
          </h3>
          <ul className="space-y-2">
            {assumptions.map((assumption, index) => (
              <li key={index} className="text-sm text-amber-900 dark:text-amber-200">
                • {assumption}
              </li>
            ))}
          </ul>
        </div>

        {/* Scope boundaries */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {ui("notes.scope")}
          </h3>
          <ul className="space-y-2">
            {scopeBoundaries.map((boundary, index) => (
              <li key={index} className="text-sm text-blue-900 dark:text-blue-200">
                • {boundary}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CollapsibleSection>
  );
}
