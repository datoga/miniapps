"use client";

import { Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import type { UnitsUI } from "@/lib/schemas";
import type { SessionDataPoint } from "./types";

interface SessionDetailModalProps {
  session: SessionDataPoint;
  unitsUI: UnitsUI;
  onClose: () => void;
}

export function SessionDetailModal({ session, unitsUI, onClose }: SessionDetailModalProps) {
  const t = useTranslations();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${t("charts.sessionDetail")} #${session.sessionNumber}`}
      size="sm"
    >
      <div className="space-y-3">
        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">{t("home.cycle")}</span>
          <span className="font-medium text-gray-900 dark:text-white">{session.cycleIndex}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">{t("exercise.table.date")}</span>
          <span className="font-medium text-gray-900 dark:text-white">{session.date}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">{t("charts.loadUsed")}</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {session.loadUsed} {unitsUI}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">{t("charts.reps")}</span>
          <span className="font-medium text-gray-900 dark:text-white">{session.reps}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">{t("charts.work")}</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {session.work} {unitsUI}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">{t("charts.estimated1RM")}</span>
          <span className="font-mono font-medium text-green-600 dark:text-green-400">
            {session.estimated1RM} {unitsUI}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">{t("session.phase")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              session.phase === "bilbo"
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {session.phase === "bilbo" ? t("session.phaseBilbo") : t("session.phaseStrength")}
          </span>
        </div>
        {session.timeSeconds && (
          <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">{t("session.duration")}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {session.timeSeconds}s
            </span>
          </div>
        )}
        {session.notes && (
          <div className="pt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t("session.notes")}:</span>
            <p className="mt-1 text-gray-900 dark:text-white">{session.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

