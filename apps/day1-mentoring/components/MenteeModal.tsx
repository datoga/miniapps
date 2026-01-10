"use client";

import { Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";
import type { Mentee, MenteeFormInput, Note } from "../lib/schemas";
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
    profession: "",
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

  // Reset form when opening/closing or when mentee changes
  useEffect(() => {
    if (open) {
      if (mentee) {
        setFormData({
          name: mentee.name,
          profession: mentee.profession ?? "",
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
          tags: [], // Tags removed
        });
      } else {
        setFormData({
          name: "",
          profession: "",
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

  const handleChange = useCallback(
    (
      field: keyof MenteeFormInput,
      value: string | number | boolean | string[] | Note[] | undefined
    ) => {
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
            fieldErrors[field] = t(
              `validation.${issue.message === "Name is required" ? "nameRequired" : issue.message}`
            );
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
      size="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8 py-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
              {t("mentee.name")} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("mentee.namePlaceholder")}
              className={`w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all ${
                errors["name"]
                  ? "border-red-500 ring-4 ring-red-500/10"
                  : "border-gray-100 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              } focus:outline-none`}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
              {t("mentee.age")}
            </label>
            <input
              type="number"
              value={formData.age ?? ""}
              onChange={(e) =>
                handleChange("age", e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="00"
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Profession */}
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
            💼 {t("mentee.profession")}
          </label>
          <input
            type="text"
            value={formData.profession ?? ""}
            onChange={(e) => handleChange("profession", e.target.value)}
            placeholder={t("mentee.professionPlaceholder")}
            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
              ✉️ {t("mentee.email")}
            </label>
            <input
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="hola@ejemplo.com"
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
              📞 {t("mentee.phone")}
            </label>
            <div className="flex gap-3">
              <input
                type="tel"
                value={formData.phone ?? ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+34 000 000 000"
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
              />
              <button
                type="button"
                onClick={() => handleChange("hasWhatsapp", !formData.hasWhatsapp)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                  formData.hasWhatsapp
                    ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20"
                    : "bg-gray-50 border-gray-100 text-gray-300 dark:bg-gray-800 dark:border-gray-700"
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Location & In-Person - SEPARATED as requested */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/30 border-2 border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🤝</span>
              <span className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                {t("mentee.inPersonAvailable")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleChange("inPersonAvailable", !formData.inPersonAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                formData.inPersonAvailable ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.inPersonAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
              📍 {t("mentee.location")}
            </label>
            <input
              type="text"
              value={formData.location ?? ""}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder={t("mentee.locationPlaceholder") || "Ciudad, País..."}
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white transition-all focus:outline-none"
            />
          </div>
        </div>

        {/* Availability Notes */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
            🕒 {t("mentee.availabilityNotes")}
          </label>
          <input
            type="text"
            value={formData.availabilityNotes ?? ""}
            onChange={(e) => handleChange("availabilityNotes", e.target.value)}
            placeholder={t("mentee.availabilityNotesPlaceholder")}
            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-black text-gray-500 hover:text-gray-900 transition-colors"
          >
            {t("menteeModal.cancel")}
          </button>
          <button
            type="submit"
            className="px-10 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
          >
            {t("menteeModal.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
});
