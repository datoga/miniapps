"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import type { Cycle, UnitsUI } from "@/lib/schemas";
import { format2, fromKg, toKg } from "@/lib/math";

interface EditCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { startedAt?: number; endedAt?: number | null; base1RMKg?: number }) => void;
  cycle: Cycle;
  unitsUI: UnitsUI;
}

export function EditCycleModal({ isOpen, onClose, onSave, cycle, unitsUI }: EditCycleModalProps) {
  const t = useTranslations();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [base1RM, setBase1RM] = useState("");

  useEffect(() => {
    if (cycle) {
      setStartDate(new Date(cycle.startedAt).toISOString().split("T")[0] || "");
      setEndDate(cycle.endedAt ? new Date(cycle.endedAt).toISOString().split("T")[0] || "" : "");
      setBase1RM(format2(fromKg(cycle.base1RMKg, unitsUI)));
    }
  }, [cycle, unitsUI]);

  const handleSave = () => {
    const updates: { startedAt?: number; endedAt?: number | null; base1RMKg?: number } = {};

    if (startDate) {
      updates.startedAt = new Date(`${startDate  }T12:00:00`).getTime();
    }

    if (endDate) {
      updates.endedAt = new Date(`${endDate  }T12:00:00`).getTime();
    } else if (cycle.endedAt && !endDate) {
      // Clear end date
      updates.endedAt = null;
    }

    const parsed1RM = parseFloat(base1RM);
    if (!isNaN(parsed1RM) && parsed1RM > 0) {
      updates.base1RMKg = toKg(parsed1RM, unitsUI);
    }

    onSave(updates);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("cycle.editTitle")} size="sm">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("cycle.startDate")}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("cycle.endDate")}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("cycle.endDateHint")}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("cycle.base1RM")} ({unitsUI})
          </label>
          <input
            type="number"
            step={0.01}
            value={base1RM}
            onChange={(e) => setBase1RM(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

