"use client";

import { Button } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";

interface EditHistoricalRestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, actualEndDate: string, endDate?: string) => void;
  initialStartDate: string;
  initialEndDate?: string;
  initialActualEndDate: string;
}

export function EditHistoricalRestModal({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  initialActualEndDate,
}: EditHistoricalRestModalProps) {
  const t = useTranslations();

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate || "");
  const [actualEndDate, setActualEndDate] = useState(initialActualEndDate);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate || "");
      setActualEndDate(initialActualEndDate);
    }
  }, [isOpen, initialStartDate, initialEndDate, initialActualEndDate]);

  const handleSave = async () => {
    if (!startDate || !actualEndDate) {
      return;
    }

    setSaving(true);
    try {
      await onSave(startDate, actualEndDate, endDate || undefined);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isValid = startDate && actualEndDate && new Date(startDate) <= new Date(actualEndDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("rest.editHistoricalTitle")}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("rest.editHistoricalDescription")}
        </p>

        {/* Start Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("rest.startDate")} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Planned End Date (optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("rest.plannedEndDate")}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("rest.plannedEndDateHint")}
          </p>
        </div>

        {/* Actual End Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("rest.actualEndDate")} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={actualEndDate}
            onChange={(e) => setActualEndDate(e.target.value)}
            min={startDate}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("rest.actualEndDateHint")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !isValid}>
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

