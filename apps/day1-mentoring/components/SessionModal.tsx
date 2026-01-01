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
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => handleChange("isRemote", true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                formData.isRemote
                  ? "bg-primary-500 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              {t("session.remote")}
            </button>
            <button
              type="button"
              onClick={() => handleChange("isRemote", false)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                !formData.isRemote
                  ? "bg-primary-500 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {t("session.inPerson")}
            </button>
          </div>
          {formData.isRemote && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-2v-3.278c0-.855-.088-1.445-1.107-1.445-.908 0-1.105.679-1.105 1.389v3.334h-2v-6h2v.816c.282-.523.94-.815 1.669-.815 1.76 0 2.543 1.139 2.543 2.924v3.075z"/>
              </svg>
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
