"use client";

import { useTranslations } from "next-intl";

interface WhatNextModalProps {
  onStartNewCycle: () => void;
  onStartRest: () => void;
}

export function WhatNextModal({ onStartNewCycle, onStartRest }: WhatNextModalProps) {
  const t = useTranslations();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          ✅ {t("cycle.cycleCompleted")}
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {t("cycle.whatNextDescription")}
        </p>
        <div className="space-y-3">
          <button
            onClick={onStartNewCycle}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-red-600 bg-red-50 p-4 hover:bg-red-100 dark:border-red-500 dark:bg-red-950 dark:hover:bg-red-900"
          >
            <span className="text-2xl">🔄</span>
            <div className="text-left">
              <span className="font-semibold text-red-700 dark:text-red-300">
                {t("exercise.startNewCycle")}
              </span>
              <p className="text-xs text-red-600 dark:text-red-400">
                {t("exercise.startNewCycleHint")}
              </p>
            </div>
          </button>
          <button
            onClick={onStartRest}
            className="flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900"
          >
            <span className="text-2xl">😴</span>
            <div className="text-left">
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {t("rest.takeRest")}
              </span>
              <p className="text-xs text-blue-600 dark:text-blue-400">{t("rest.takeRestHint")}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

