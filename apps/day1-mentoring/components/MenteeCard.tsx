"use client";
// Force refresh

import { useTranslations } from "next-intl";
import { memo } from "react";
import type { Mentee, Session } from "../lib/schemas";

interface MenteeCardProps {
  mentee: Mentee;
  sessionsCount: number;
  nextSession?: Session;
  onClick: () => void;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const MenteeCard = memo(function MenteeCard({
  mentee,
  sessionsCount,
  nextSession,
  onClick,
  onArchive,
  onDelete,
}: MenteeCardProps) {
  const t = useTranslations();

  if (!mentee || !mentee.name) {
    return null;
  }

  const isArchived = mentee.archived;
  const initial = mentee.name.trim().charAt(0)?.toUpperCase() || "?";

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col h-full min-h-[280px] p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
        isArchived
          ? "bg-gray-50/50 border-gray-200 grayscale opacity-75 hover:opacity-100"
          : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-white/5 shadow-sm hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1"
      }`}
    >
      {/* Header Actions */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(e);
          }}
          className="p-2 rounded-xl bg-white dark:bg-gray-700 text-gray-400 hover:text-primary-500 shadow-sm transition-colors"
          title={isArchived ? t("actions.unarchive") : t("actions.archive")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 8V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
            <path d="M21 3H3" />
            <path d="M10 12h4" />
          </svg>
        </button>

        {isArchived && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="p-2 rounded-xl bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 shadow-sm transition-colors"
            title={t("actions.delete")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner ${
            isArchived
              ? "bg-gray-100 text-gray-400"
              : "bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 text-primary-700 dark:text-primary-300"
          }`}
        >
          {initial}
        </div>
        <div>
          <h3
            className={`font-bold text-xl leading-tight ${
              isArchived ? "text-gray-500" : "text-gray-900 dark:text-white"
            }`}
          >
            {mentee.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
            {mentee.age && (
              <span>
                {mentee.age} {t("mentee.ageLabel")}
              </span>
            )}
            {mentee.location && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="truncate max-w-[120px]">{mentee.location}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Next Session Highlight */}
      <div className="mt-auto space-y-4">
        <div
          className={`p-4 rounded-2xl transition-colors ${
            nextSession
              ? "bg-primary-50/50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30"
              : "bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
          }`}
        >
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Próxima Sesión
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${nextSession ? "bg-white text-primary-500 shadow-sm" : "bg-gray-100 text-gray-400"}`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div>
              <p
                className={`text-sm font-bold ${nextSession ? "text-gray-900 dark:text-white" : "text-gray-400"}`}
              >
                {nextSession ? (
                  <>
                    {new Date(nextSession.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {nextSession.time ? (
                      <>
                        <span className="text-gray-400 font-normal mx-2">•</span>
                        <span>{nextSession.time}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  "Sin programar"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div className="flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span>
              {sessionsCount} {sessionsCount === 1 ? "Sesión" : "Sesiones"}
            </span>
          </div>

          {mentee.goals && mentee.goals.length > 0 && (
            <div className="flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-emerald-500"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>
                {Math.round(
                  (mentee.goals.filter((g) => g.completed).length / mentee.goals.length) * 100
                )}
                %
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
