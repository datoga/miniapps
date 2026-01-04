"use client";

import { useTranslations } from "next-intl";
import type { Cycle } from "@/lib/schemas";
import { getCycleColor } from "./colors";

interface CycleSelectorProps {
  cycles: Cycle[];
  selectedCycleIds: string[];
  lastCycleId?: string;
  onToggle: (cycleId: string) => void;
  onSelectAll: () => void;
  onSelectOnlyLast: () => void;
}

export function CycleSelector({
  cycles,
  selectedCycleIds,
  lastCycleId,
  onToggle,
  onSelectAll,
  onSelectOnlyLast,
}: CycleSelectorProps) {
  const t = useTranslations();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("charts.selectCycles")}:
        </span>
        <div className="flex gap-2">
          <button
            onClick={onSelectOnlyLast}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {t("charts.onlyLast")}
          </button>
          <button
            onClick={onSelectAll}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {t("charts.showAll")}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {cycles.sort((a, b) => b.index - a.index).map((cycle, idx) => {
          const color = getCycleColor(idx);
          const isSelected = selectedCycleIds.includes(cycle.id);
          return (
            <button
              key={cycle.id}
              onClick={() => onToggle(cycle.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              style={{
                backgroundColor: isSelected ? color.main : undefined,
                boxShadow: isSelected ? `0 4px 14px ${color.main}40` : undefined,
              }}
            >
              {t("home.cycle")} {cycle.index}
              {cycle.id === lastCycleId && !cycle.endedAt && " ⚡"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

