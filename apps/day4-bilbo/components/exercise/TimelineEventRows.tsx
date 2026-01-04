"use client";

import { formatWeight } from "@/lib/math";
import type { Cycle, UnitsUI } from "@/lib/schemas";
import { useTranslations } from "next-intl";

interface CycleStartRowProps {
  cycle: Cycle;
  timestamp: number;
  unitsUI: UnitsUI;
  onDelete: () => void;
}

export function CycleStartRow({ cycle, timestamp, unitsUI, onDelete }: CycleStartRowProps) {
  const t = useTranslations();

  return (
    <tr className="bg-green-50 dark:bg-green-950/30">
      <td colSpan={6} className="px-2 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <span className="text-lg">🚀</span>
            <span className="font-medium">
              {t("exercise.timeline.cycleStarted", { number: cycle.index })}
            </span>
            <span className="text-xs text-green-600 dark:text-green-500">
              <span className="md:hidden">
                {new Date(timestamp).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "numeric",
                })}
              </span>
              <span className="hidden md:inline">
                {new Date(timestamp).toLocaleDateString()}
              </span>
              {" · 1RM: "}
              {formatWeight(cycle.base1RMKg, unitsUI)}
            </span>
          </div>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title={t("common.delete")}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

interface CycleEndRowProps {
  cycle: Cycle;
  timestamp: number;
  unitsUI: UnitsUI;
  onDelete: () => void;
}

export function CycleEndRow({ cycle, timestamp, unitsUI, onDelete }: CycleEndRowProps) {
  const t = useTranslations();

  return (
    <tr className="bg-amber-50 dark:bg-amber-950/30">
      <td colSpan={6} className="px-2 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <span className="text-lg">🏁</span>
            <span className="font-medium">
              {t("exercise.timeline.cycleEnded", { number: cycle.index })}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-500">
              <span className="md:hidden">
                {new Date(timestamp).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "numeric",
                })}
              </span>
              <span className="hidden md:inline">
                {new Date(timestamp).toLocaleDateString()}
              </span>
              {cycle.improved1RMKg && (
                <> · 1RM: {formatWeight(cycle.improved1RMKg, unitsUI)}</>
              )}
            </span>
          </div>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title={t("common.delete")}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

interface RestStartRowProps {
  date: string;
}

export function RestStartRow({ date }: RestStartRowProps) {
  const t = useTranslations();

  return (
    <tr className="bg-blue-50 dark:bg-blue-950/30">
      <td colSpan={6} className="px-2 py-2">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <span className="text-lg">😴</span>
          <span className="font-medium">{t("exercise.timeline.restStarted")}</span>
          <span className="text-xs text-blue-600 dark:text-blue-500">
            <span className="md:hidden">
              {new Date(date).toLocaleDateString(undefined, {
                day: "numeric",
                month: "numeric",
              })}
            </span>
            <span className="hidden md:inline">{new Date(date).toLocaleDateString()}</span>
          </span>
        </div>
      </td>
    </tr>
  );
}

