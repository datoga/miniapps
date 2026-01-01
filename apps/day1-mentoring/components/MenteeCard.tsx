"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { Mentee, Session } from "../lib/schemas";

interface MenteeCardProps {
  mentee: Mentee;
  sessionsCount: number;
  lastSession?: Session;
  onClick: () => void;
}

export const MenteeCard = memo(function MenteeCard({
  mentee,
  sessionsCount,
  lastSession,
  onClick,
}: MenteeCardProps) {
  const t = useTranslations();

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600"
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{mentee.name}</h3>
        {mentee.archived && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            📦 {t("mentee.archived")}
          </span>
        )}
      </div>

      {mentee.goal && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{mentee.goal}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {sessionsCount} {t("mentee.sessions").toLowerCase()}
        </span>
        {lastSession && (
          <>
            <span>•</span>
            <span>{lastSession.date}</span>
          </>
        )}
        {mentee.inPersonAvailable && (
          <>
            <span>•</span>
            <span>📍</span>
          </>
        )}
      </div>

      {mentee.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {mentee.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {tag}
            </span>
          ))}
          {mentee.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">+{mentee.tags.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
});

