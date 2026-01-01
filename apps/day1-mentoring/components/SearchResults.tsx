"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { Mentee, Session } from "../lib/schemas";

interface SearchResultsProps {
  mentees: Mentee[];
  sessions: (Session & { menteeName: string })[];
  onMenteeClick: (mentee: Mentee) => void;
  onSessionClick: (session: Session & { menteeName: string }) => void;
}

export const SearchResults = memo(function SearchResults({
  mentees,
  sessions,
  onMenteeClick,
  onSessionClick,
}: SearchResultsProps) {
  const t = useTranslations();

  const hasResults = mentees.length > 0 || sessions.length > 0;

  if (!hasResults) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-4 text-4xl">🔍</div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          {t("dashboard.noResults")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{t("dashboard.noResultsDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mentees group */}
      {mentees.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("dashboard.menteesGroup")} ({mentees.length})
          </h3>
          <div className="space-y-2">
            {mentees.map((mentee) => (
              <button
                key={mentee.id}
                onClick={() => onMenteeClick(mentee)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {mentee.name}
                  </span>
                  {mentee.archived && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      📦
                    </span>
                  )}
                </div>
                {mentee.goal && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{mentee.goal}</p>
                )}
                {mentee.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mentee.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sessions group */}
      {sessions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("dashboard.sessionsGroup")} ({sessions.length})
          </h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionClick(session)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {session.menteeName}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{session.date}</span>
                </div>
                {session.title && (
                  <h4 className="mt-1 font-medium text-gray-900 dark:text-white">
                    {session.title}
                  </h4>
                )}
                {session.notes && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {session.notes}
                  </p>
                )}
                {session.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {session.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

