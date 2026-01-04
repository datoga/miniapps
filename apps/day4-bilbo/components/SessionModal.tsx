"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import type { Exercise, Cycle, Session, SessionPhase, UnitsUI } from "@/lib/schemas";
import { formatWeight, format2, fromKg, toKg, estimate1RM, computeWork } from "@/lib/math";
import { useBilboData } from "@/lib/hooks/useBilboData";
import { formatSessionShare, shareContent } from "@/lib/share";
import * as db from "@/lib/db";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise;
  cycle: Cycle;
  suggestedLoadKg: number;
  unitsUI: UnitsUI;
  onSave: () => void;
  onBilboCompletedEndCycle: () => void; // Called when user chooses to end cycle after Bilbo completion
  editSession?: Session; // If provided, modal is in edit mode
  hasBilboCompleted?: boolean; // True if any session in cycle had <15 reps (Bilbo phase done)
  previousSession?: { reps: number; loadUsedKg: number } | null; // Previous session info
}

export function SessionModal({
  isOpen,
  onClose,
  exercise,
  cycle,
  suggestedLoadKg,
  unitsUI,
  onSave,
  onBilboCompletedEndCycle,
  editSession,
  hasBilboCompleted = false,
  previousSession = null,
}: SessionModalProps) {
  const t = useTranslations();
  const { logSession, updateSession, settings } = useBilboData();

  const isEditMode = !!editSession;
  const today = new Date().toISOString().split("T")[0] as string;

  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState("");
  const [loadUsed, setLoadUsed] = useState(format2(fromKg(suggestedLoadKg, unitsUI)));
  const [reps, setReps] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showBilboCompletionModal, setShowBilboCompletionModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<{
    loadKg: number;
    reps: number;
    workKg: number;
    sessionNumber: number;
  } | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  // Initialize form with edit session data
  useEffect(() => {
    if (editSession) {
      // Extract date directly from the datetime string to avoid timezone issues
      // datetime format is "YYYY-MM-DDTHH:MM:SS"
      const datePart = editSession.datetime.split("T")[0] as string;
      setDate(datePart);

      const hasTime = !editSession.datetime.endsWith("T00:00:00");
      if (hasTime) {
        // Extract time part directly from the string
        const timePart = editSession.datetime.split("T")[1];
        setTime(timePart ? timePart.slice(0, 5) : "");
      } else {
        setTime("");
      }
      setLoadUsed(format2(fromKg(editSession.loadUsedKg, unitsUI)));
      setReps(String(editSession.reps));
      setDuration(editSession.timeSeconds ? String(editSession.timeSeconds) : "");
      setNotes(editSession.notes || "");
    }
  }, [editSession, unitsUI]);

  // Update suggested load when it changes (for new sessions, not edit mode)
  useEffect(() => {
    if (!editSession && suggestedLoadKg > 0) {
      setLoadUsed(format2(fromKg(suggestedLoadKg, unitsUI)));
    }
  }, [suggestedLoadKg, unitsUI, editSession]);

  const loadUsedKg = toKg(parseFloat(loadUsed) || 0, unitsUI);
  const repsNum = parseInt(reps) || 0;
  const workKg = computeWork(loadUsedKg, repsNum);
  const estimated1RM = repsNum > 0 ? estimate1RM(loadUsedKg, repsNum) : 0;

  // Phase is automatic based on Bilbo method:
  // - "bilbo" = Until a session with <15 reps is logged (testing correct weight)
  // - "strength" = After Bilbo is completed (a session had <15 reps)
  // When editing, preserve the original phase
  const phase: SessionPhase = isEditMode
    ? editSession!.phase
    : (hasBilboCompleted ? "strength" : "bilbo");

  // Check if form is valid (all required fields filled)
  const isFormValid = date && loadUsed && parseFloat(loadUsed) > 0 && reps && repsNum > 0;

  const handleSave = async () => {
    // Validation
    if (!date) {
      setError(`${t("session.date")} is required`);
      return;
    }
    if (!loadUsed || parseFloat(loadUsed) <= 0) {
      setError(`${t("session.loadUsed")} is required`);
      return;
    }
    if (!reps || repsNum <= 0) {
      setError(`${t("session.reps")} is required`);
      return;
    }

    setError("");

    // Check if this is a Bilbo phase session with < 15 reps (Bilbo completion)
    // Only for new sessions, not edits
    if (!isEditMode && phase === "bilbo" && repsNum < 15) {
      // Show the Bilbo completion modal to ask user what to do
      setShowBilboCompletionModal(true);
      return;
    }

    // Normal save flow
    await doSave();
  };

  const doSave = async (endCycleAfterSave = false) => {
    setSaving(true);

    try {
      if (isEditMode && editSession) {
        await updateSession(editSession.id, {
          date,
          time: time || undefined,
          loadUsedKg,
          reps: repsNum,
          phase,
          timeSeconds: duration ? parseInt(duration) : undefined,
          notes: notes || undefined,
        });
        onSave();
      } else {
        await logSession(
          exercise.id,
          cycle.id,
          date,
          time || undefined,
          loadUsedKg,
          repsNum,
          phase,
          duration ? parseInt(duration) : undefined,
          notes || undefined
        );

        if (endCycleAfterSave) {
          // User chose to end the cycle - trigger the end cycle flow
          onBilboCompletedEndCycle();
        } else {
          // Get session count for this cycle
          const cycleSessions = await db.getSessionsForCycle(cycle.id);
          const sessionNumber = cycleSessions.length;

          // Show success screen with share option
          setSavedSessionData({
            loadKg: loadUsedKg,
            reps: repsNum,
            workKg,
            sessionNumber,
          });
          setShowSuccess(true);
          setSaving(false);
        }
      }
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!savedSessionData) {
      return;
    }

    const shareText = formatSessionShare(
      {
        exerciseName: exercise.name,
        loadKg: savedSessionData.loadKg,
        reps: savedSessionData.reps,
        workKg: savedSessionData.workKg,
        cycleIndex: cycle.index,
        sessionNumber: savedSessionData.sessionNumber,
        unitsUI,
        phase,
      },
      t
    );

    const result = await shareContent(shareText, t("share.session.title"));

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

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSavedSessionData(null);
    setShareStatus("idle");
    onSave();
  };

  // Handle Bilbo completion choice: Continue with strength adaptation
  const handleContinueStrength = async () => {
    setShowBilboCompletionModal(false);
    await doSave(false); // Save session, continue cycle (next sessions will be strength)
  };

  // Handle Bilbo completion choice: End cycle
  const handleEndCycleBilbo = async () => {
    setShowBilboCompletionModal(false);
    await doSave(true); // Save session and end cycle
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t("session.editTitle") : t("session.title")} size="md">
      <div className="space-y-4">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("session.date")} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("session.time")}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Suggested Load (readonly) - only show when creating new session */}
        {!isEditMode && (
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t("session.suggestedLoad")}: </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatWeight(suggestedLoadKg, unitsUI)}
            </span>
          </div>
        )}

        {/* Load Used */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.loadUsed")} ({unitsUI}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={loadUsed}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || parseFloat(val) >= 0) {setLoadUsed(val);}
            }}
            required
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-lg text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          {/* Show previous session load */}
          {!isEditMode && previousSession && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("session.previousLoad")}: <span className="font-medium text-gray-700 dark:text-gray-300">{formatWeight(previousSession.loadUsedKg, unitsUI)}</span>
            </p>
          )}
        </div>

        {/* Reps */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.reps")} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={reps}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || parseInt(val) >= 1) {setReps(val);}
            }}
            required
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-lg text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Duration (optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.duration")} ({t("units.seconds")})
          </label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || parseInt(val) >= 1) {setDuration(val);}
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Phase (auto-calculated) - shown as info banner */}
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            phase === "bilbo"
              ? "bg-red-50 dark:bg-red-950/50"
              : "bg-blue-50 dark:bg-blue-950/50"
          }`}
        >
          <span>{phase === "bilbo" ? "🔴" : "💪"}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t("session.phase")}:</span>
          <span
            className={`font-semibold ${
              phase === "bilbo"
                ? "text-red-700 dark:text-red-300"
                : "text-blue-700 dark:text-blue-300"
            }`}
          >
            {phase === "bilbo" ? t("session.phaseBilbo") : t("session.phaseStrength")}
          </span>
        </div>

        {/* Computed values */}
        {repsNum > 0 && loadUsedKg > 0 && (
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-green-50 p-4 dark:bg-green-950">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">{t("session.work")}</p>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {format2(fromKg(workKg, unitsUI))} {unitsUI}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">{t("session.estimated1RM")}</p>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {formatWeight(estimated1RM, unitsUI)}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("session.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !isFormValid}>
            {saving ? t("common.loading") : (isEditMode ? t("session.update") : t("session.save"))}
          </Button>
        </div>
      </div>

      {/* Success Screen with Share Option */}
      {showSuccess && savedSessionData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900">
                ✅
              </div>
            </div>

            <h3 className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-white">
              {t("session.savedSuccess")}
            </h3>

            <div className="mb-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("charts.loadUsed")}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {format2(fromKg(savedSessionData.loadKg, unitsUI))} {unitsUI}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("charts.reps")}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{savedSessionData.reps}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("charts.work")}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {format2(fromKg(savedSessionData.workKg, unitsUI))} {unitsUI}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("charts.estimated1RM")}</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatWeight(estimate1RM(savedSessionData.loadKg, savedSessionData.reps), unitsUI)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCloseSuccess} className="flex-1">
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
              <p className="mt-2 text-center text-sm text-green-600 dark:text-green-400">
                {t("share.copied")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bilbo Completion Modal - appears when < 15 reps in Bilbo phase */}
      {showBilboCompletionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-900">
                🎯
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t("session.bilboCompletedTitle")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("session.bilboCompletedSubtitle", { reps: repsNum })}
                </p>
              </div>
            </div>

            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
              {t("session.bilboCompletedDescription")}
            </p>

            <div className="space-y-3">
              {/* Option 1: Continue with Strength */}
              <button
                onClick={handleContinueStrength}
                disabled={saving}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-3 text-left transition-all hover:border-blue-400 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:hover:border-blue-600 dark:hover:bg-blue-900/50 md:gap-4 md:p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-200 text-2xl dark:bg-blue-800 md:h-10 md:w-10 md:text-xl">
                  💪
                </div>
                <div className="hidden flex-1 md:block">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {t("session.continueStrengthOption")}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t("session.continueStrengthHint", { increment: format2(fromKg(settings.globalIncrementKg, unitsUI)), units: unitsUI })}
                  </p>
                </div>
                <span className="flex-1 font-semibold text-blue-900 dark:text-blue-100 md:hidden">
                  {t("session.continueStrengthOption")}
                </span>
              </button>

              {/* Option 2: End Cycle */}
              <button
                onClick={handleEndCycleBilbo}
                disabled={saving}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-3 text-left transition-all hover:border-green-400 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/50 dark:hover:border-green-600 dark:hover:bg-green-900/50 md:gap-4 md:p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-200 text-2xl dark:bg-green-800 md:h-10 md:w-10 md:text-xl">
                  🏁
                </div>
                <div className="hidden flex-1 md:block">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {t("session.endCycleOption")}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t("session.endCycleOptionHint")}
                  </p>
                </div>
                <span className="flex-1 font-semibold text-green-900 dark:text-green-100 md:hidden">
                  {t("session.endCycleOption")}
                </span>
              </button>
            </div>

            {saving && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                <span className="text-sm">{t("common.loading")}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

