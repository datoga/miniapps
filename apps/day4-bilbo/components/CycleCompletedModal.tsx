"use client";

import { Button, Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { format2, fromKg } from "@/lib/math";
import type { UnitsUI } from "@/lib/schemas";
import { formatCycleShare, shareContent } from "@/lib/share";

interface CycleCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  cycleIndex: number;
  sessionCount: number;
  startDate: string;
  endDate: string;
  initial1RMKg: number;
  final1RMKg: number;
  totalWorkKg: number;
  unitsUI: UnitsUI;
}

export function CycleCompletedModal({
  isOpen,
  onClose,
  exerciseName,
  cycleIndex,
  sessionCount,
  startDate,
  endDate,
  initial1RMKg,
  final1RMKg,
  totalWorkKg,
  unitsUI,
}: CycleCompletedModalProps) {
  const t = useTranslations();
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  const improvement = final1RMKg - initial1RMKg;
  const improvementPercent = initial1RMKg > 0 ? ((improvement / initial1RMKg) * 100).toFixed(1) : "0";

  const handleShare = async () => {
    const shareText = formatCycleShare(
      {
        exerciseName,
        cycleIndex,
        sessionCount,
        startDate,
        endDate,
        initial1RMKg,
        final1RMKg,
        totalWorkKg,
        unitsUI,
      },
      t
    );

    const result = await shareContent(shareText, t("share.cycle.title"));

    if (result.success) {
      if (result.method === "clipboard") {
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 2000);
      }
    } else {
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-lg">
            🏆
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("share.cycle.completed")}!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {exerciseName} · {t("home.cycle")} {cycleIndex}
          </p>
        </div>

        {/* Stats */}
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-800 dark:to-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("share.cycle.sessions")}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{sessionCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("share.cycle.duration")}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {startDate} → {endDate}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("share.cycle.initial1RM")}</p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {format2(fromKg(initial1RMKg, unitsUI))} {unitsUI}
                </p>
              </div>
              <div className="text-2xl">→</div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("share.cycle.final1RM")}</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {format2(fromKg(final1RMKg, unitsUI))} {unitsUI}
                </p>
              </div>
            </div>

            {improvement > 0 && (
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                  📈 +{format2(fromKg(improvement, unitsUI))} {unitsUI} ({improvementPercent}%)
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4 text-center dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("share.cycle.totalWork")}</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {format2(fromKg(totalWorkKg, unitsUI))} {unitsUI}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t("common.close")}
          </Button>
          <Button
            variant="primary"
            onClick={handleShare}
            className="flex-1 gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t("share.button")}
          </Button>
        </div>

        {/* Share status feedback */}
        {shareStatus === "copied" && (
          <p className="text-center text-sm text-green-600 dark:text-green-400">
            {t("share.copied")}
          </p>
        )}
      </div>
    </Modal>
  );
}

