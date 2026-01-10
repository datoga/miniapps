"use client";

import { Button, Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { availableEmojis, ExerciseIcon } from "@/lib/icons";
import { estimate1RM, format2, fromKg, toKg } from "@/lib/math";
import type { PresetType, UnitsUI } from "@/lib/schemas";

interface AddExerciseData {
  exerciseName: string;
  presetType: PresetType;
  iconPresetKey: string;
  emoji?: string;
  base1RMKg: number;
}

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddExerciseData) => void;
  unitsUI: UnitsUI;
  existingExerciseNames: string[];
  isFirstExercise?: boolean;
}

export function AddExerciseModal({
  isOpen,
  onClose,
  onSave,
  unitsUI,
  existingExerciseNames,
  isFirstExercise = false,
}: AddExerciseModalProps) {
  const t = useTranslations();

  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const [data, setData] = useState<AddExerciseData>({
    exerciseName: "",
    presetType: "bench",
    iconPresetKey: "bench",
    base1RMKg: 0,
  });

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcWeight, setCalcWeight] = useState("");
  const [calcReps, setCalcReps] = useState("");
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const displayBase1RM = fromKg(data.base1RMKg, unitsUI);

  // Check if exercise name already exists (case insensitive)
  const isDuplicate = existingExerciseNames.some(
    (name) => name.toLowerCase() === data.exerciseName.trim().toLowerCase()
  );

  // Handle Enter key to proceed to next step
  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
            canGo = data.exerciseName.trim().length > 0 && !isDuplicate;
            break;
          case 2:
            canGo = data.base1RMKg > 0;
            break;
        }
        if (canGo) {
          if (step < totalSteps) {
            setStep(step + 1);
          } else {
            onSave(data);
            // Reset form
            setStep(1);
            setData({
              exerciseName: "",
              presetType: "bench",
              iconPresetKey: "bench",
              base1RMKg: 0,
            });
            setShowCalculator(false);
            setCalcWeight("");
            setCalcReps("");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, data, showCalculator, showEmojiPicker, onSave, isDuplicate]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onSave(data);
      // Reset form
      setStep(1);
      setData({
        exerciseName: "",
        presetType: "bench",
        iconPresetKey: "bench",
        base1RMKg: 0,
      });
      setShowCalculator(false);
      setCalcWeight("");
      setCalcReps("");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setStep(1);
    setData({
      exerciseName: "",
      presetType: "bench",
      iconPresetKey: "bench",
      base1RMKg: 0,
    });
    setShowCalculator(false);
    setCalcWeight("");
    setCalcReps("");
    onClose();
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

  const applyCalculatedRM = useCallback(() => {
    const weight = parseFloat(calcWeight);
    const reps = parseInt(calcReps);
    if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
      const weightKg = toKg(weight, unitsUI);
      const estimated = estimate1RM(weightKg, reps);
      setData({ ...data, base1RMKg: estimated });
      setShowCalculator(false);
    }
  }, [calcWeight, calcReps, data, unitsUI]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.exerciseName.trim().length > 0 && !isDuplicate;
      case 2:
        return data.base1RMKg > 0;
      default:
        return false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("home.addExercise")} size="md">
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Exercise Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t(isFirstExercise ? "wizard.exercise.title" : "wizard.exercise.titleAdd")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("wizard.exercise.description")}
            </p>

            {/* Preset buttons */}
            <div className="grid grid-cols-2 gap-3">
              {(["bench", "squat", "deadlift", "row", "ohp", "custom"] as PresetType[]).map(
                (preset) => {
                  // Check if this preset already exists (by translated name)
                  const presetName = t(`presets.${preset}`);
                  const alreadyExists =
                    preset !== "custom" &&
                    existingExerciseNames.some(
                      (name) => name.toLowerCase() === presetName.toLowerCase()
                    );

                  const handleClick = () => {
                    if (alreadyExists) {
                      setDuplicateMessage(presetName);
                      setTimeout(() => setDuplicateMessage(null), 2500);
                    } else {
                      setDuplicateMessage(null);
                      selectPreset(preset);
                    }
                  };

                  return (
                    <button
                      key={preset}
                      onClick={handleClick}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        alreadyExists
                          ? "border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900"
                          : data.presetType === preset
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      <ExerciseIcon
                        iconPresetKey={preset}
                        emoji={preset === data.presetType ? data.emoji : undefined}
                        className={`w-8 h-8 ${alreadyExists ? "opacity-50" : ""}`}
                      />
                      <span
                        className={`text-sm font-medium ${alreadyExists ? "text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"}`}
                      >
                        {presetName}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Duplicate message toast */}
            {duplicateMessage && (
              <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center dark:bg-amber-950/50 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ {t("exercise.duplicateMessage", { name: duplicateMessage })}
                </p>
              </div>
            )}

            {/* Custom name input */}
            {data.presetType === "custom" && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={data.exerciseName}
                  onChange={(e) => setData({ ...data, exerciseName: e.target.value })}
                  placeholder={t("wizard.exercise.customName")}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />

                {/* Emoji selector */}
                <div>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
                  >
                    <span className="text-xl">{data.emoji || "🏋️"}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("wizard.exercise.chooseIcon")}
                    </span>
                  </button>
                  {showEmojiPicker && (
                    <div className="mt-2 grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                      {availableEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => selectEmoji(emoji)}
                          className={`rounded p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            data.emoji === emoji ? "bg-blue-100 dark:bg-blue-900" : ""
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected exercise preview / duplicate warning */}
            {data.exerciseName && (
              <div
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  isDuplicate ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"
                }`}
              >
                <ExerciseIcon
                  iconPresetKey={data.iconPresetKey}
                  emoji={data.emoji}
                  className="w-10 h-10"
                />
                <div>
                  <p
                    className={`text-xs ${
                      isDuplicate
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {isDuplicate ? t("exercise.duplicate") : t("common.selected")}
                  </p>
                  <p
                    className={`font-semibold ${
                      isDuplicate
                        ? "text-red-800 dark:text-red-200"
                        : "text-green-800 dark:text-green-200"
                    }`}
                  >
                    {data.exerciseName}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 1RM */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("wizard.base1RM.title")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("wizard.base1RM.description")}
            </p>

            {/* Direct 1RM input */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                1RM ({unitsUI})
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={displayBase1RM > 0 ? format2(displayBase1RM) : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || parseFloat(val) >= 0) {
                    setData({
                      ...data,
                      base1RMKg: val ? toKg(parseFloat(val), unitsUI) : 0,
                    });
                  }
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xl font-bold text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>

            {/* Calculator toggle */}
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="w-full rounded-lg border border-gray-200 p-3 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              🧮 {t("wizard.base1RM.calculate")}
            </button>

            {/* Calculator panel */}
            {showCalculator && (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                  {t("cycle.calculator.title")}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      {t("cycle.calculator.weight")} ({unitsUI})
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
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
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
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  {calcWeight &&
                    calcReps &&
                    parseFloat(calcWeight) > 0 &&
                    parseInt(calcReps) > 0 && (
                      <>
                        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {t("cycle.calculator.estimated")}:
                          </p>
                          <p className="text-lg font-bold text-green-800 dark:text-green-200">
                            {format2(
                              fromKg(
                                estimate1RM(
                                  toKg(parseFloat(calcWeight), unitsUI),
                                  parseInt(calcReps)
                                ),
                                unitsUI
                              )
                            )}{" "}
                            {unitsUI}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={applyCalculatedRM}
                        >
                          {t("cycle.calculator.apply")}
                        </Button>
                      </>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={step === 1 ? handleClose : handleBack}>
            {step === 1 ? t("common.cancel") : t("common.back")}
          </Button>
          <Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
            {step === totalSteps ? t("common.save") : t("common.next")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
