"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { t, tMany } from "../../lib/professions/translations";
import { CollapsibleSection } from "./CollapsibleSection";

interface TasksSectionProps {
  profession: Profession;
  id?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const automationLevels = ["assist", "partial", "majority", "total"] as const;
const horizons = ["0-2", "3-5", "5-10"] as const;

const automationLevelColors = {
  assist: {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    active: "bg-blue-500 text-white",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30",
  },
  partial: {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    active: "bg-yellow-500 text-white",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
  },
  majority: {
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    active: "bg-orange-500 text-white",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-900/30",
  },
  total: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    active: "bg-red-500 text-white",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30",
  },
};

const horizonColors = {
  "0-2": {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    active: "bg-emerald-500 text-white",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
  },
  "3-5": {
    badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    active: "bg-cyan-500 text-white",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30",
  },
  "5-10": {
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    active: "bg-purple-500 text-white",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30",
  },
};

type AutomationLevel = (typeof automationLevels)[number];
type Horizon = (typeof horizons)[number];

export function TasksSection({ profession, id = "tasks", isOpen = false, onToggle = () => {} }: TasksSectionProps) {
  const locale = useLocale();
  const ui = useTranslations("profession");

  const [selectedAutomation, setSelectedAutomation] = useState<AutomationLevel | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<Horizon | null>(null);

  const filteredTasks = useMemo(() => {
    return profession.tasks.filter((task) => {
      if (selectedAutomation && task.automationLevel !== selectedAutomation) {
        return false;
      }
      if (selectedHorizon && task.horizon !== selectedHorizon) {
        return false;
      }
      return true;
    });
  }, [profession.tasks, selectedAutomation, selectedHorizon]);

  const toggleAutomation = (level: AutomationLevel) => {
    setSelectedAutomation((current) => (current === level ? null : level));
  };

  const toggleHorizon = (horizon: Horizon) => {
    setSelectedHorizon((current) => (current === horizon ? null : horizon));
  };

  const clearFilters = () => {
    setSelectedAutomation(null);
    setSelectedHorizon(null);
  };

  const hasActiveFilters = selectedAutomation !== null || selectedHorizon !== null;

  return (
    <CollapsibleSection
      id={id}
      title={ui("tasks.title")}
      subtitle={ui("tasks.subtitle")}
      icon="⚙️"
      count={profession.tasks.length}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Automation Level Filter */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            {ui("tasks.filterByAutomation")}
          </p>
          <div className="flex flex-wrap gap-2">
            {automationLevels.map((level) => {
              const isActive = selectedAutomation === level;
              const count = profession.tasks.filter((t) => t.automationLevel === level).length;
              return (
                <button
                  key={level}
                  onClick={() => toggleAutomation(level)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                    isActive
                      ? automationLevelColors[level].active
                      : automationLevelColors[level].inactive
                  }`}
                >
                  {ui(`automationLevels.${level}`)}
                  <span className="ml-1.5 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizon Filter */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            {ui("tasks.filterByHorizon")}
          </p>
          <div className="flex flex-wrap gap-2">
            {horizons.map((horizon) => {
              const isActive = selectedHorizon === horizon;
              const count = profession.tasks.filter((t) => t.horizon === horizon).length;
              return (
                <button
                  key={horizon}
                  onClick={() => toggleHorizon(horizon)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                    isActive
                      ? horizonColors[horizon].active
                      : horizonColors[horizon].inactive
                  }`}
                >
                  {ui(`horizonsBadge.${horizon}`)}
                  <span className="ml-1.5 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear filters & results count */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {ui("tasks.showing", { count: filteredTasks.length, total: profession.tasks.length })}
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {ui("tasks.clearFilters")}
            </button>
          </div>
        )}
      </div>

      {/* Tasks list */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {ui("tasks.noResults")}
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const taskDesc = t(task.taskKey, locale);
            const whyItChanges = tMany(task.whyItChangesKeys, locale);
            const whatStaysHuman = tMany(task.whatStaysHumanKeys, locale);

            return (
              <details
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex-1 pr-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {taskDesc}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${automationLevelColors[task.automationLevel].badge}`}>
                        {ui(`automationLevels.${task.automationLevel}`)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${horizonColors[task.horizon].badge}`}>
                        {ui(`horizonsBadge.${task.horizon}`)}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>

                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {/* Why it changes */}
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                        {ui("tasks.whyItChanges")}
                      </h4>
                      <ul className="space-y-1">
                        {whyItChanges.map((reason, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">→</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What stays human */}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        {ui("tasks.whatStaysHuman")}
                      </h4>
                      <ul className="space-y-1">
                        {whatStaysHuman.map((aspect, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">●</span>
                            {aspect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </CollapsibleSection>
  );
}
