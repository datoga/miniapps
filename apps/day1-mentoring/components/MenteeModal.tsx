"use client";

import { memo, useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import { TagInput } from "./TagInput";
import { NoteInput } from "./NoteInput";
import type { Mentee, MenteeFormInput, Note } from "../lib/schemas";
import { MenteeFormSchema } from "../lib/schemas";

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB max

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
    image: undefined,
    phone: "",
    hasWhatsapp: false,
    location: "",
    inPersonAvailable: false,
    availabilityNotes: "",
    goal: "",
    notes: [],
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when opening/closing or when mentee changes
  useEffect(() => {
    if (open) {
      if (mentee) {
        setFormData({
          name: mentee.name,
          age: mentee.age,
          image: mentee.image,
          phone: mentee.phone ?? "",
          hasWhatsapp: mentee.hasWhatsapp ?? false,
          location: mentee.location ?? mentee.inPersonNotes ?? "",
          inPersonAvailable: mentee.inPersonAvailable ?? false,
          availabilityNotes: mentee.availabilityNotes ?? "",
          goal: mentee.goal ?? "",
          notes: Array.isArray(mentee.notes) ? mentee.notes : [],
          tags: mentee.tags,
        });
      } else {
        setFormData({
          name: "",
          age: undefined,
          image: undefined,
          phone: "",
          hasWhatsapp: false,
          location: "",
          inPersonAvailable: false,
          availabilityNotes: "",
          goal: "",
          notes: [],
          tags: [],
        });
      }
      setErrors({});
    }
  }, [open, mentee]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((prev) => ({ ...prev, image: "Image too large (max 500KB)" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, image: result }));
      setErrors((prev) => ({ ...prev, image: "" }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleChange = useCallback(
    (field: keyof MenteeFormInput, value: string | number | boolean | string[] | Note[] | undefined) => {
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
        {/* Image and Name row */}
        <div className="flex gap-4">
          {/* Image */}
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {formData.image ? (
              <div className="relative">
                <img
                  src={formData.image}
                  alt="Mentee"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-[10px] text-gray-400">{t("mentee.image")}</span>
              </button>
            )}
            {errors["image"] && <p className="mt-1 text-xs text-red-500">{errors["image"]}</p>}
          </div>

          {/* Name */}
          <div className="flex-1">
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

        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            📞 {t("mentee.phone")}
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={formData.phone ?? ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder={t("mentee.phonePlaceholder")}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={formData.hasWhatsapp ?? false}
                onChange={(e) => handleChange("hasWhatsapp", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">WhatsApp</span>
            </label>
          </div>
        </div>

        {/* Location (remote) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            🌐 {t("mentee.location")}
          </label>
          <input
            type="text"
            value={formData.location ?? ""}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder={t("mentee.locationPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* In-person availability */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formData.inPersonAvailable ?? false}
              onChange={(e) => handleChange("inPersonAvailable", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🤝 {t("mentee.inPersonAvailable")}
            </span>
          </label>
          {formData.inPersonAvailable && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("mentee.availabilityNotes")}
              </label>
              <input
                type="text"
                value={formData.availabilityNotes ?? ""}
                onChange={(e) => handleChange("availabilityNotes", e.target.value)}
                placeholder={t("mentee.availabilityNotesPlaceholder")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

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

        {/* Notes (post-its) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("mentee.notes")}
          </label>
          <NoteInput
            notes={formData.notes ?? []}
            onChange={(notes) => handleChange("notes", notes)}
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

