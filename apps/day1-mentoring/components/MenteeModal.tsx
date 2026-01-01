"use client";

import { memo, useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import { TagInput } from "./TagInput";
import { NoteInput } from "./NoteInput";
import type { Mentee, MenteeFormInput, Note } from "../lib/schemas";
import { MenteeFormSchema } from "../lib/schemas";
import { resizeImage } from "../lib/imageUtils";

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
    email: "",
    phone: "",
    hasWhatsapp: false,
    location: "",
    inPersonAvailable: false,
    availabilityNotes: "",
    goals: [],
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
          email: mentee.email ?? "",
          phone: mentee.phone ?? "",
          hasWhatsapp: mentee.hasWhatsapp ?? false,
          location: mentee.location ?? mentee.inPersonNotes ?? "",
          inPersonAvailable: mentee.inPersonAvailable ?? false,
          availabilityNotes: mentee.availabilityNotes ?? "",
          goals: Array.isArray(mentee.goals) ? mentee.goals : [],
          notes: Array.isArray(mentee.notes) ? mentee.notes : [],
          tags: mentee.tags,
        });
      } else {
        setFormData({
          name: "",
          age: undefined,
          image: undefined,
          email: "",
          phone: "",
          hasWhatsapp: false,
          location: "",
          inPersonAvailable: false,
          availabilityNotes: "",
          goals: [],
          notes: [],
          tags: [],
        });
      }
      setErrors({});
    }
  }, [open, mentee]);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Resize image to 256px max dimension with 80% quality
      const resizedImage = await resizeImage(file, 256, 0.8);
      setFormData((prev) => ({ ...prev, image: resizedImage }));
      setErrors((prev) => ({ ...prev, image: "" }));
    } catch (error) {
      console.error("Failed to process image:", error);
      setErrors((prev) => ({ ...prev, image: "Failed to process image" }));
    }
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
        <div className="flex items-start gap-4">
          {/* Image */}
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            {formData.image ? (
              <div className="relative">
                <img
                  src={formData.image}
                  alt="Mentee"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 flex flex-col items-center justify-center gap-0.5 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-[9px] text-gray-400">{t("mentee.image")}</span>
              </button>
            )}
            {errors["image"] && <p className="mt-1 text-xs text-red-500">{errors["image"]}</p>}
          </div>

          {/* Name */}
          <div className="flex-1 pt-0.5">
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

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            ✉️ {t("mentee.email")}
          </label>
          <input
            type="email"
            value={formData.email ?? ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder={t("mentee.emailPlaceholder")}
            className={`w-full rounded-lg border px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 dark:bg-gray-700 dark:text-white ${
              errors["email"]
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary-500 dark:border-gray-600"
            }`}
          />
          {errors["email"] && <p className="mt-1 text-sm text-red-500">{errors["email"]}</p>}
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
              onChange={(e) => {
                const newPhone = e.target.value;
                handleChange("phone", newPhone);
                // Auto-uncheck WhatsApp if phone is cleared
                if (!newPhone.trim() && formData.hasWhatsapp) {
                  handleChange("hasWhatsapp", false);
                }
              }}
              placeholder={t("mentee.phonePlaceholder")}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              disabled={!formData.phone?.trim()}
              onClick={() => formData.phone?.trim() && handleChange("hasWhatsapp", !formData.hasWhatsapp)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                !formData.phone?.trim()
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800"
                  : formData.hasWhatsapp
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={
                !formData.phone?.trim()
                  ? "text-gray-300 dark:text-gray-600"
                  : formData.hasWhatsapp
                    ? "text-green-500"
                    : "text-gray-400"
              }>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
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

        {/* Notes (post-its) - only show when editing */}
        {isEdit && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("mentee.notes")}
            </label>
            <NoteInput
              notes={formData.notes ?? []}
              onChange={(notes) => handleChange("notes", notes)}
            />
          </div>
        )}

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

