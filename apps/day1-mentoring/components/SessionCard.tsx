"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { Session } from "../lib/schemas";

interface SessionCardProps {
  session: Session;
  onEdit: () => void;
  onDelete: () => void;
}

export const SessionCard = memo(function SessionCard({
  session,
  onEdit,
  onDelete,
}: SessionCardProps) {
  const t = useTranslations();

  const completedSteps = session.nextSteps.filter((s) => s.done).length;
  const totalSteps = session.nextSteps.length;

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
            {session.nextSteps.slice(0, 2).map((step) => (
              <li key={step.id} className="flex items-center gap-2 text-sm">
                {step.done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
                <span className={step.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}>
                  {step.text}
                </span>
              </li>
            ))}
            {totalSteps > 2 && (
              <li className="text-xs text-gray-400 dark:text-gray-500 pl-5">
                +{totalSteps - 2} más
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
