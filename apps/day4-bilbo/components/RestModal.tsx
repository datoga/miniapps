"use client";

import { Button } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";

interface RestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate?: string) => void;
  previousCycleEndDate?: number; // ms timestamp of previous cycle end
  // For edit mode
  isEditing?: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function RestModal({
  isOpen,
  onClose,
  onSave,
  previousCycleEndDate,
  isEditing = false,
  initialStartDate,
  initialEndDate,
}: RestModalProps) {
  const t = useTranslations();

  // Calculate default start date:
  // - If editing: use initial value
  // - If previous cycle ended: previous end date + 1 day
  // - Otherwise: today
  const getDefaultStartDate = () => {
    if (initialStartDate) {
      return initialStartDate;
    }
    if (previousCycleEndDate) {
      const nextDay = new Date(previousCycleEndDate + 24 * 60 * 60 * 1000);
      return nextDay.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(initialEndDate || "");
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (isOpen) {
      setStartDate(getDefaultStartDate());
      setEndDate(initialEndDate || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialStartDate, initialEndDate]);

  const handleSave = async () => {
    if (!startDate) {
      return;
    }

    setSaving(true);
    try {
      await onSave(startDate, endDate || undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t("rest.editTitle") : t("rest.title")}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("rest.description")}</p>

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

        {/* End Date (optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("rest.endDate")}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("rest.endDateHint")}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !startDate}>
            {(() => {
              if (saving) {
                return t("common.loading");
              }
              if (isEditing) {
                return t("common.save");
              }
              return t("rest.startRest");
            })()}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
