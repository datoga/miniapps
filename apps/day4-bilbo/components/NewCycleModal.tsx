"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import type { Cycle, UnitsUI } from "@/lib/schemas";
import { formatWeight, format2, fromKg, toKg, estimate1RM } from "@/lib/math";

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base1RMKg: number) => void;
  unitsUI: UnitsUI;
  previousCycle?: Cycle;
}

export function NewCycleModal({
  isOpen,
  onClose,
  onSave,
  unitsUI,
  previousCycle,
}: NewCycleModalProps) {
  const t = useTranslations();

  // Suggested base: improved1RM if exists, otherwise previous base1RM
  const suggestedBaseKg = previousCycle
    ? previousCycle.improved1RMKg || previousCycle.base1RMKg
    : 0;

  const [base1RM, setBase1RM] = useState(
    suggestedBaseKg > 0 ? format2(fromKg(suggestedBaseKg, unitsUI)) : ""
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcWeight, setCalcWeight] = useState("");
  const [calcReps, setCalcReps] = useState("");

  const handleSave = () => {
    const value = parseFloat(base1RM);
    if (isNaN(value) || value <= 0) {return;}
    onSave(toKg(value, unitsUI));
  };

  const applyCalculatedRM = useCallback(() => {
    const weight = parseFloat(calcWeight);
    const reps = parseInt(calcReps);
    if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
      const weightKg = toKg(weight, unitsUI);
      const estimated = estimate1RM(weightKg, reps);
      setBase1RM(format2(fromKg(estimated, unitsUI)));
      setShowCalculator(false);
    }
  }, [calcWeight, calcReps, unitsUI]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("cycle.title")} size="sm">
      <div className="space-y-4">
        {/* Suggested base */}
        {suggestedBaseKg > 0 && (
          <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
            <span className="text-gray-600 dark:text-gray-400">{t("cycle.suggestedBase")}: </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatWeight(suggestedBaseKg, unitsUI)}
            </span>
          </div>
        )}

        {/* Base 1RM input */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("cycle.base1RM")} ({unitsUI})
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={base1RM}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || parseFloat(val) >= 0) {setBase1RM(val);}
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Calculator button */}
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="w-full rounded-lg border border-gray-200 p-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          🧮 {t("cycle.useCalculator")}
        </button>

        {/* Calculator */}
        {showCalculator && (
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
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
                    if (val === "" || parseFloat(val) >= 0) {setCalcWeight(val);}
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
                    if (val === "" || parseInt(val) >= 1) {setCalcReps(val);}
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              {calcWeight && calcReps && parseFloat(calcWeight) > 0 && parseInt(calcReps) > 0 && (
                <>
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {t("cycle.calculator.estimated")}:
                    </p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">
                      {format2(
                        fromKg(
                          estimate1RM(toKg(parseFloat(calcWeight), unitsUI), parseInt(calcReps)),
                          unitsUI
                        )
                      )}{" "}
                      {unitsUI}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={applyCalculatedRM}>
                    {t("cycle.calculator.apply")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!base1RM || parseFloat(base1RM) <= 0}>
            {t("cycle.start")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

