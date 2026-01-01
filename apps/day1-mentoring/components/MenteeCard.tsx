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

  const isArchived = mentee.archived;

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-2xl p-5 text-left transition-all duration-200 border ${
        isArchived
          ? "bg-amber-50/50 border-amber-200/50 hover:border-amber-300 dark:bg-amber-900/10 dark:border-amber-800/30 dark:hover:border-amber-700/50"
          : "bg-white border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:shadow-none"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {mentee.image ? (
            <img
              src={mentee.image}
              alt={mentee.name}
              className={`w-10 h-10 rounded-full object-cover shadow-sm ${
                isArchived ? "opacity-70" : ""
              }`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm shadow-sm ${
              isArchived
                ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900"
                : "bg-gradient-to-br from-primary-400 to-primary-600 text-white"
            }`}>
              {mentee.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className={`font-semibold transition-colors ${
              isArchived
                ? "text-amber-800 dark:text-amber-300"
                : "text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
            }`}>
              {mentee.name}
            </h3>
            {mentee.age && (
              <span className={`text-xs ${isArchived ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
                {mentee.age} años
              </span>
            )}
          </div>
        </div>
        {isArchived && (
          <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded font-medium">
            {t("mentee.archived")}
          </span>
        )}
      </div>

      {/* Goal */}
      {mentee.goal && (
        <p className={`text-sm line-clamp-2 mb-3 leading-relaxed ${
          isArchived ? "text-amber-700 dark:text-amber-400/80" : "text-gray-600 dark:text-gray-400"
        }`}>
          {mentee.goal}
        </p>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between pt-3 border-t ${
        isArchived ? "border-amber-200/50 dark:border-amber-800/30" : "border-gray-100 dark:border-gray-700/50"
      }`}>
        <div className={`flex items-center gap-3 text-xs ${
          isArchived ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"
        }`}>
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {sessionsCount}
          </span>
          {lastSession && (
            <span className={isArchived ? "text-amber-500 dark:text-amber-500" : "text-gray-400 dark:text-gray-500"}>
              {lastSession.date}
            </span>
          )}
        </div>
        {mentee.inPersonNotes && (
          <span className="cursor-help text-sm" title={mentee.inPersonNotes}>📍</span>
        )}
      </div>

      {/* Tags */}
      {mentee.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentee.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs rounded-md ${
                isArchived
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {tag}
            </span>
          ))}
          {mentee.tags.length > 3 && (
            <span className={`text-xs ${isArchived ? "text-amber-500" : "text-gray-400"}`}>
              +{mentee.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
});
