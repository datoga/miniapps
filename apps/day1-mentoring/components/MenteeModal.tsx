"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import { TagInput } from "./TagInput";
import type { Mentee, MenteeFormInput } from "../lib/schemas";
import { MenteeFormSchema } from "../lib/schemas";

interface MenteeModalProps {
  open: boolean;
  mentee: Mentee | null;
  onSave: (input: MenteeFormInput) => void;
  onClose: () => void;
}

export const MenteeModal = memo(function MenteeModal({
  open,
  mentee,
  onSave,
  onClose,
}: MenteeModalProps) {
  const t = useTranslations();
  const isEdit = !!mentee;

  const [formData, setFormData] = useState<MenteeFormInput>({
    name: "",
    age: undefined,
    inPersonAvailable: false,
    inPersonNotes: "",
    goal: "",
    notes: "",
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opening/closing or when mentee changes
  useEffect(() => {
    if (open) {
      if (mentee) {
        setFormData({
          name: mentee.name,
          age: mentee.age,
          inPersonAvailable: mentee.inPersonAvailable ?? false,
          inPersonNotes: mentee.inPersonNotes ?? "",
          goal: mentee.goal ?? "",
          notes: mentee.notes ?? "",
          tags: mentee.tags,
        });
      } else {
        setFormData({
          name: "",
          age: undefined,
          inPersonAvailable: false,
          inPersonNotes: "",
          goal: "",
          notes: "",
          tags: [],
        });
      }
      setErrors({});
    }
  }, [open, mentee]);

  const handleChange = useCallback(
    (field: keyof MenteeFormInput, value: string | number | boolean | string[] | undefined) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate
      const result = MenteeFormSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (field && typeof field === "string") {
            fieldErrors[field] = t(`validation.${issue.message === "Name is required" ? "nameRequired" : issue.message}`);
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
      title={isEdit ? t("menteeModal.editTitle") : t("menteeModal.createTitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("mentee.name")} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={t("mentee.namePlaceholder")}
            className={`w-full rounded-lg border px-3 py-2 text-gray-900 dark:bg-gray-700 dark:text-white ${
              errors["name"]
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary-500 dark:border-gray-600"
            } focus:outline-none focus:ring-1`}
          />
          {errors["name"] && <p className="mt-1 text-sm text-red-500">{errors["name"]}</p>}
        </div>

        {/* Age */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("mentee.age")}
          </label>
          <input
            type="number"
            value={formData.age ?? ""}
            onChange={(e) =>
              handleChange("age", e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder={t("mentee.agePlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* In-person available */}
        <div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.inPersonAvailable ?? false}
              onChange={(e) => handleChange("inPersonAvailable", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            {t("mentee.inPersonAvailable")}
          </label>
        </div>

        {/* In-person notes */}
        {formData.inPersonAvailable && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("mentee.inPersonNotes")}
            </label>
            <input
              type="text"
              value={formData.inPersonNotes ?? ""}
              onChange={(e) => handleChange("inPersonNotes", e.target.value)}
              placeholder={t("mentee.inPersonNotesPlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        {/* Goal */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("mentee.goal")}
          </label>
          <textarea
            value={formData.goal ?? ""}
            onChange={(e) => handleChange("goal", e.target.value)}
            placeholder={t("mentee.goalPlaceholder")}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("mentee.notes")}
          </label>
          <textarea
            value={formData.notes ?? ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder={t("mentee.notesPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("mentee.tags")}
          </label>
          <TagInput
            tags={formData.tags}
            onChange={(tags) => handleChange("tags", tags)}
            placeholder={t("mentee.tagsPlaceholder")}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("menteeModal.cancel")}
          </Button>
          <Button type="submit">{t("menteeModal.save")}</Button>
        </div>
      </form>
    </Modal>
  );
});

