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
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {session.date}
            </span>
            {session.rating && (
              <span className="text-sm text-yellow-500">
                {"⭐".repeat(session.rating)}
              </span>
            )}
          </div>
          {session.title && (
            <h4 className="mt-1 font-medium text-gray-900 dark:text-white">{session.title}</h4>
          )}
          {session.notes && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {session.notes}
            </p>
          )}
        </div>
        <div className="ml-4 flex gap-1">
          <button
            onClick={onEdit}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title={t("actions.edit")}
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
            title={t("actions.delete")}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Next steps */}
      {totalSteps > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t("session.nextSteps")}</span>
            <span>
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-1.5 rounded-full bg-green-500 transition-all"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
          <ul className="mt-2 space-y-1">
            {session.nextSteps.slice(0, 3).map((step) => (
              <li key={step.id} className="flex items-center gap-2 text-sm">
                <span className={step.done ? "text-green-500" : "text-gray-400"}>
                  {step.done ? "✓" : "○"}
                </span>
                <span
                  className={`${
                    step.done
                      ? "text-gray-500 line-through dark:text-gray-500"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {step.text}
                </span>
              </li>
            ))}
            {totalSteps > 3 && (
              <li className="text-xs text-gray-500 dark:text-gray-500">
                +{totalSteps - 3} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Tags */}
      {session.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
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
    </div>
  );
});

