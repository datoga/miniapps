"use client";

import { Button, Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/drive";
import { availableEmojis, ExerciseIcon, presetIcons } from "@/lib/icons";
import { estimate1RM, format2, fromKg, toKg } from "@/lib/math";
import type { PresetType, UnitsUI } from "@/lib/schemas";

interface WizardData {
  unitsUI: UnitsUI;
  globalIncrementKg: number;
  exerciseName: string;
  presetType: PresetType;
  iconPresetKey: string;
  emoji?: string;
  base1RMKg: number;
}

interface FirstRunWizardProps {
  onComplete: (data: WizardData) => void;
}

export function FirstRunWizard({ onComplete }: FirstRunWizardProps) {
  const t = useTranslations();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [data, setData] = useState<WizardData>({
    unitsUI: "kg",
    globalIncrementKg: 2.5,
    exerciseName: "",
    presetType: "bench",
    iconPresetKey: "bench",
    base1RMKg: 0,
  });

  const [showCalculator, setShowCalculator] = useState(false);
  const [isSyncConnecting, setIsSyncConnecting] = useState(false);
  const [isSyncConnected, setIsSyncConnected] = useState(false);
  const [syncProfile, setSyncProfile] = useState<{ name?: string; email?: string; picture?: string } | null>(null);
  const [calcWeight, setCalcWeight] = useState("");
  const [calcReps, setCalcReps] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Initialize with bench press selected by default
  useEffect(() => {
    if (data.exerciseName === "" && data.presetType === "bench") {
      setData((prev) => ({ ...prev, exerciseName: t("presets.bench") }));
    }
  }, [t, data.exerciseName, data.presetType]);

  // Handle Enter key to proceed to next step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if calculator or emoji picker is open
      if (showCalculator || showEmojiPicker) {
        return;
      }
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        // Check canProceed inline to avoid stale closure
        let canGo = false;
        switch (step) {
          case 1:
            canGo = true;
            break;
          case 2:
            canGo = data.globalIncrementKg > 0;
            break;
          case 3:
            canGo = data.exerciseName.trim().length > 0;
            break;
          case 4:
            canGo = data.base1RMKg > 0;
            break;
          case 5:
            canGo = true; // Optional step, always can proceed
            break;
        }
        if (canGo) {
          if (step < totalSteps) {
            setStep(step + 1);
          } else {
            onComplete(data);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, data, showCalculator, showEmojiPicker, onComplete]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const selectPreset = (preset: PresetType) => {
    setData({
      ...data,
      presetType: preset,
      iconPresetKey: preset,
      exerciseName: preset === "custom" ? "" : t(`presets.${preset}`),
      emoji: undefined,
    });
  };

  const selectEmoji = (emoji: string) => {
    setData({ ...data, emoji });
    setShowEmojiPicker(false);
  };

  const handleGoogleSignIn = async () => {
    setIsSyncConnecting(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setSyncProfile(result.profile);
        setIsSyncConnected(true);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsSyncConnecting(false);
    }
  };

  const applyCalculatedRM = useCallback(() => {
    const weight = parseFloat(calcWeight);
    const reps = parseInt(calcReps);
    if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
      const weightKg = toKg(weight, data.unitsUI);
      const estimated = estimate1RM(weightKg, reps);
      setData({ ...data, base1RMKg: estimated });
      setShowCalculator(false);
    }
  }, [calcWeight, calcReps, data]);

  const displayIncrement = fromKg(data.globalIncrementKg, data.unitsUI);
  const displayBase1RM = fromKg(data.base1RMKg, data.unitsUI);

  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // Units
      case 2:
        return data.globalIncrementKg > 0;
      case 3:
        return data.exerciseName.trim().length > 0;
      case 4:
        return data.base1RMKg > 0;
      case 5:
        return true; // Optional sync step
      default:
        return false;
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🏋️</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {t("wizard.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t("wizard.subtitle")}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("wizard.step", { current: step, total: totalSteps })}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {step === 1 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("wizard.units.title")}
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t("wizard.units.description")}
              </p>
              <div className="space-y-2">
                {(["kg", "lb"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setData({ ...data, unitsUI: unit })}
                    className={`flex w-full items-center gap-3 rounded-lg border p-4 ${
                      data.unitsUI === unit
                        ? "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-2xl">{unit === "kg" ? "🏋️" : "💪"}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {t(`wizard.units.${unit}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("wizard.increment.title")}
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t("wizard.increment.description")}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={displayIncrement}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0.5) {
                      setData({ ...data, globalIncrementKg: toKg(val, data.unitsUI) });
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  {data.unitsUI}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t("wizard.increment.hint")}
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("wizard.exercise.title")}
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t("wizard.exercise.description")}
              </p>

              {/* Preset buttons */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["bench", "squat", "deadlift", "row"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => selectPreset(preset)}
                    className={`flex items-center gap-2 rounded-lg border p-3 ${
                      data.presetType === preset
                        ? "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="h-6 w-6 text-gray-700 dark:text-gray-300">
                      {presetIcons[preset]}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t(`wizard.exercise.presets.${preset}`)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom option */}
              <button
                onClick={() => selectPreset("custom")}
                className={`mb-4 flex w-full items-center gap-2 rounded-lg border p-3 ${
                  data.presetType === "custom"
                    ? "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-xl">✨</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("wizard.exercise.custom")}
                </span>
              </button>

              {/* Custom name input */}
              {data.presetType === "custom" && (
                <input
                  type="text"
                  placeholder={t("wizard.exercise.customName")}
                  value={data.exerciseName}
                  onChange={(e) => setData({ ...data, exerciseName: e.target.value })}
                  className="mb-4 w-full rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              )}

              {/* Icon/Emoji selection */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("wizard.exercise.chooseIcon")}:
                </span>
                <button
                  onClick={() => setShowEmojiPicker(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  {data.emoji ? (
                    <span className="text-2xl">{data.emoji}</span>
                  ) : (
                    <ExerciseIcon iconPresetKey={data.iconPresetKey} className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("wizard.base1RM.title")}
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t("wizard.base1RM.description")}
              </p>

              <div className="mb-4 flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={displayBase1RM > 0 ? format2(displayBase1RM) : ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      setData({ ...data, base1RMKg: toKg(val, data.unitsUI) });
                    } else if (e.target.value === "") {
                      setData({ ...data, base1RMKg: 0 });
                    }
                  }}
                  placeholder={t("wizard.base1RM.manual")}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  {data.unitsUI}
                </span>
              </div>

              <button
                onClick={() => setShowCalculator(true)}
                className="w-full rounded-lg border border-gray-200 p-3 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                🧮 {t("wizard.base1RM.calculate")}
              </button>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("wizard.sync.title")}
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t("wizard.sync.description")}
              </p>

              <div className="mb-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
                {isSyncConnected && syncProfile ? (
                  <>
                    <div className="mb-3 flex justify-center">
                      {syncProfile.picture ? (
                        <img
                          src={syncProfile.picture}
                          alt={syncProfile.name || "Profile"}
                          className="h-12 w-12 rounded-full"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-900">
                          ✓
                        </div>
                      )}
                    </div>
                    <p className="mb-1 font-medium text-gray-900 dark:text-white">
                      {syncProfile.name || syncProfile.email}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ {t("wizard.sync.connected")}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-3 text-4xl">☁️</div>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      {t("wizard.sync.googleDriveInfo")}
                    </p>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSyncConnecting}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      {isSyncConnecting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      {isSyncConnecting ? t("common.loading") : t("settings.sync.signIn")}
                    </button>
                  </>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 {t("wizard.sync.skipHint")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              {t("wizard.back")}
            </Button>
          ) : (
            <div />
          )}
          <Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
            {step === totalSteps ? t("wizard.finish") : t("wizard.next")}
          </Button>
        </div>
      </div>

      {/* 1RM Calculator Modal */}
      <Modal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        title={t("cycle.calculator.title")}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("cycle.calculator.weight")} ({data.unitsUI})
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={calcWeight}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || parseFloat(val) >= 0) {
                  setCalcWeight(val);
                }
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("cycle.calculator.reps")}
            </label>
            <input
              type="number"
              min="1"
              value={calcReps}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || parseInt(val) >= 1) {
                  setCalcReps(val);
                }
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {calcWeight && calcReps && parseFloat(calcWeight) > 0 && parseInt(calcReps) > 0 && (
            <>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t("cycle.calculator.estimated")}:
                </p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {format2(
                    fromKg(
                      estimate1RM(toKg(parseFloat(calcWeight), data.unitsUI), parseInt(calcReps)),
                      data.unitsUI
                    )
                  )}{" "}
                  {data.unitsUI}
                </p>
              </div>

              <Button variant="primary" className="w-full" onClick={applyCalculatedRM}>
                {t("cycle.calculator.apply")}
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        title={t("wizard.exercise.chooseIcon")}
        size="sm"
      >
        <div className="grid grid-cols-6 gap-2">
          {availableEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => selectEmoji(emoji)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 ${
                data.emoji === emoji ? "bg-red-100 dark:bg-red-900" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
