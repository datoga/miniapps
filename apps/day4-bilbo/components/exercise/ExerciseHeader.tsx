"use client";

import { ExerciseIcon } from "@/lib/icons";
import { formatWeight } from "@/lib/math";
import type { Cycle, Exercise, UnitsUI } from "@/lib/schemas";
import { useTranslations } from "next-intl";

interface ExerciseHeaderProps {
  exercise: Exercise;
  activeCycle: Cycle | null;
  suggestedLoad: number | null;
  unitsUI: UnitsUI;
}

export function ExerciseHeader({
  exercise,
  activeCycle,
  suggestedLoad,
  unitsUI,
}: ExerciseHeaderProps) {
  const t = useTranslations();

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3">
        {/* Left side: Icon, name, cycle info */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 md:h-16 md:w-16 dark:bg-red-950 dark:text-red-400">
            <ExerciseIcon
              iconPresetKey={exercise.iconPresetKey}
              emoji={exercise.emoji}
              className="h-7 w-7 text-2xl md:h-10 md:w-10 md:text-3xl"
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
              {exercise.name}
            </h1>
            {activeCycle && (
              <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {t("home.cycle")} {activeCycle.index}
                </span>
                {suggestedLoad !== null && (
                  <span className="ml-2">
                    · {t("home.nextSuggested")}:{" "}
                    <strong className="text-red-600 dark:text-red-400">
                      {formatWeight(suggestedLoad, unitsUI)}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: 1RM Display */}
        {activeCycle && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {/* Base 1RM Card */}
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-white">
              <span className="text-sm">🎯</span>
              <span className="text-[10px] font-medium uppercase opacity-80">1RM</span>
              <span className="text-sm font-bold">
                {formatWeight(activeCycle.base1RMKg, unitsUI)}
              </span>
            </div>

            {/* New Estimated 1RM Card */}
            {activeCycle.improved1RMKg && activeCycle.improved1RMKg > activeCycle.base1RMKg && (
              <div className="flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-white">
                <span className="text-sm">📈</span>
                <span className="text-[10px] font-medium uppercase opacity-80">
                  {t("rm.new")}
                </span>
                <span className="text-sm font-bold">
                  {formatWeight(activeCycle.improved1RMKg, unitsUI)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


