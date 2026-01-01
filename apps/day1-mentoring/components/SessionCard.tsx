"use client";

import { memo, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Session } from "../lib/schemas";

interface SessionCardProps {
  session: Session;
  menteeName: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStep?: (stepId: string, done: boolean) => void;
}

export const SessionCard = memo(function SessionCard({
  session,
  menteeName,
  onEdit,
  onDelete,
  onToggleStep,
}: SessionCardProps) {
  const t = useTranslations();

  const completedSteps = session.nextSteps.filter((s) => s.done).length;
  const totalSteps = session.nextSteps.length;

  // Check if session is in the future
  const isFutureSession = useMemo(() => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate >= today;
  }, [session.date]);

  // Generate Google Calendar URL
  const calendarUrl = useMemo(() => {
    const sessionDate = new Date(session.date);
    // Format: YYYYMMDD
    const dateStr = session.date.replace(/-/g, "");
    // Default 1 hour session
    const startDate = dateStr;
    const endDate = dateStr;

    const title = encodeURIComponent(
      session.title
        ? `${session.title} - ${menteeName}`
        : `Sesión con ${menteeName}`
    );

    const details = encodeURIComponent(
      [
        session.notes,
        session.nextSteps.length > 0
          ? `\n\nPróximos pasos:\n${session.nextSteps.map(s => `- ${s.text}`).join("\n")}`
          : ""
      ].filter(Boolean).join("")
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
  }, [session, menteeName]);

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(calendarUrl, "_blank");
  };

  return (
    <div
      className="group rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {session.date}
            </span>
            {isFutureSession && (
              <button
                onClick={handleAddToCalendar}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                title={t("session.addToCalendar")}
              >
                📅
              </button>
            )}
          </div>
          {session.title && (
            <h4 className="font-medium text-gray-900 dark:text-white">{session.title}</h4>
          )}
          {session.notes && (
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {session.notes}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-4 rounded-lg px-2 py-1 text-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title={t("actions.delete")}
        >
          🗑️
        </button>
      </div>

      {/* Next steps */}
      {totalSteps > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">{t("session.nextSteps")}</span>
            <span className="text-gray-400 dark:text-gray-500">
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
          <ul className="mt-2 space-y-1">
            {session.nextSteps.slice(0, 3).map((step) => (
              <li key={step.id} className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStep?.(step.id, !step.done);
                  }}
                  className="flex-shrink-0 hover:scale-110 transition-transform"
                >
                  {step.done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors" />
                  )}
                </button>
                <span className={step.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}>
                  {step.text}
                </span>
              </li>
            ))}
            {totalSteps > 3 && (
              <li className="text-xs text-gray-400 dark:text-gray-500 pl-6">
                +{totalSteps - 3} más
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Tags */}
      {session.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
