"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import { TagInput } from "./TagInput";
import type { Session, SessionFormInput, NextStep } from "../lib/schemas";
import { SessionFormSchema } from "../lib/schemas";
import { getTodayDate } from "../lib/repos/sessionsRepo";

interface SessionModalProps {
  open: boolean;
  session: Session | null;
  onSave: (input: SessionFormInput) => void;
  onClose: () => void;
}

export const SessionModal = memo(function SessionModal({
  open,
  session,
  onSave,
  onClose,
}: SessionModalProps) {
  const t = useTranslations();
  const isEdit = !!session;

  const [formData, setFormData] = useState<SessionFormInput>({
    date: getTodayDate(),
    title: "",
    notes: "",
    nextSteps: [],
    tags: [],
    isRemote: true, // Remote by default
  });

  const [newStepText, setNewStepText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opening/closing or when session changes
  useEffect(() => {
    if (open) {
      if (session) {
        setFormData({
          date: session.date,
          title: session.title ?? "",
          notes: session.notes ?? "",
          nextSteps: session.nextSteps,
          tags: session.tags,
          isRemote: session.isRemote ?? true,
        });
      } else {
        setFormData({
          date: getTodayDate(),
          title: "",
          notes: "",
          nextSteps: [],
          tags: [],
          isRemote: true,
        });
      }
      setNewStepText("");
      setErrors({});
    }
  }, [open, session]);

  const handleChange = useCallback(
    (
      field: keyof SessionFormInput,
      value: string | number | boolean | NextStep[] | string[] | undefined
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const handleAddStep = useCallback(() => {
    if (newStepText.trim()) {
      const newStep: NextStep = {
        id: uuidv4(),
        text: newStepText.trim(),
        done: false,
      };
      setFormData((prev) => ({
        ...prev,
        nextSteps: [...prev.nextSteps, newStep],
      }));
      setNewStepText("");
    }
  }, [newStepText]);

  const handleToggleStep = useCallback((stepId: string) => {
    setFormData((prev) => ({
      ...prev,
      nextSteps: prev.nextSteps.map((s) =>
        s.id === stepId ? { ...s, done: !s.done } : s
      ),
    }));
  }, []);

  const handleRemoveStep = useCallback((stepId: string) => {
    setFormData((prev) => ({
      ...prev,
      nextSteps: prev.nextSteps.filter((s) => s.id !== stepId),
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate
      const result = SessionFormSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (field && typeof field === "string") {
            fieldErrors[field] = t(`validation.${issue.message === "Invalid date format" ? "invalidDate" : issue.message}`);
          }
        }
        setErrors(fieldErrors);
        return;
      }

      onSave(result.data);
    },
    [formData, onSave, t]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("sessionModal.editTitle") : t("sessionModal.createTitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.date")} *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-gray-900 dark:bg-gray-700 dark:text-white ${
              errors["date"]
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary-500 dark:border-gray-600"
            } focus:outline-none focus:ring-1`}
          />
          {errors["date"] && <p className="mt-1 text-sm text-red-500">{errors["date"]}</p>}
        </div>

        {/* Remote/In-person toggle */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.sessionType")}
          </label>
          <div className="relative inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {/* Sliding background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-200 dark:bg-gray-700 ${
                formData.isRemote ? "translate-x-0" : "translate-x-[calc(100%+4px)]"
              }`}
            />
            <button
              type="button"
              onClick={() => handleChange("isRemote", true)}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                formData.isRemote
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              💻 {t("session.remote")}
            </button>
            <button
              type="button"
              onClick={() => handleChange("isRemote", false)}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                !formData.isRemote
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              👥 {t("session.inPerson")}
            </button>
          </div>
          {formData.isRemote && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] dark:bg-blue-900/30">ℹ</span>
              {t("session.remoteHint")}
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.title")}
          </label>
          <input
            type="text"
            value={formData.title ?? ""}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder={t("session.titlePlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.notes")}
          </label>
          <textarea
            value={formData.notes ?? ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder={t("session.notesPlaceholder")}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Next Steps */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.nextSteps")}
          </label>
          <div className="space-y-2">
            {formData.nextSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={step.done}
                  onChange={() => handleToggleStep(step.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span
                  className={`flex-1 text-sm ${
                    step.done
                      ? "text-gray-500 line-through"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {step.text}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(step.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStep();
                  }
                }}
                placeholder={t("session.nextStepsPlaceholder")}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddStep}>
                {t("session.addNextStep")}
              </Button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("session.tags")}
          </label>
          <TagInput
            tags={formData.tags}
            onChange={(tags) => handleChange("tags", tags)}
            placeholder={t("session.tagsPlaceholder")}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("sessionModal.cancel")}
          </Button>
          <Button type="submit">{t("sessionModal.save")}</Button>
        </div>
      </form>
    </Modal>
  );
});
