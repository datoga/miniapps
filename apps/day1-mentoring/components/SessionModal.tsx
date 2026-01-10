"use client";

import { Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";
import { getTodayDate } from "../lib/repos/sessionsRepo";
import type { Session, SessionFormInput } from "../lib/schemas";
import { SessionFormSchema } from "../lib/schemas";

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
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
    title: "",
    notes: "",
    nextSteps: [],
    tags: [],
    isRemote: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opening/closing or when session changes
  useEffect(() => {
    if (open) {
      if (session) {
        setFormData({
          date: session.date,
          time: session.time ?? "",
          title: session.title ?? "",
          notes: session.notes ?? "",
          nextSteps: session.nextSteps,
          tags: session.tags,
          isRemote: session.isRemote ?? true,
        });
      } else {
        setFormData({
          date: getTodayDate(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          title: "",
          notes: "",
          nextSteps: [],
          tags: [],
          isRemote: true,
        });
      }
      setErrors({});
    }
  }, [open, session]);

  const handleChange = useCallback((field: keyof SessionFormInput, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
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
            fieldErrors[field] = t(
              `validation.${issue.message === "Invalid date format" ? "invalidDate" : issue.message}`
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
      title={isEdit ? t("sessionModal.editTitle") : t("sessionModal.createTitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="grid grid-cols-2 gap-6">
          {/* Date */}
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t("session.date")} *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className={`w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white transition-all ${
                errors["date"]
                  ? "border-red-500 focus:ring-red-500/10"
                  : "border-gray-100 dark:border-gray-700 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10"
              } focus:outline-none`}
            />
            {errors["date"] && (
              <p className="mt-1.5 text-xs text-red-500 font-bold">{errors["date"]}</p>
            )}
          </div>

          {/* Time */}
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              🕒 {t("session.time") || "Hora"}
            </label>
            <input
              type="time"
              value={formData.time ?? ""}
              onChange={(e) => handleChange("time", e.target.value)}
              className={`w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white transition-all ${
                errors["time"]
                  ? "border-red-500 focus:ring-red-500/10"
                  : "border-gray-100 dark:border-gray-700 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10"
              } focus:outline-none`}
            />
          </div>
        </div>

        {/* Remote Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border-2 border-gray-100 dark:border-gray-800/50">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {t("session.remote")}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isRemote}
              onChange={(e) => handleChange("isRemote", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-500 transition-all duration-300" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
          </label>
        </div>

        {/* Notes / Description */}
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("session.notes") || "Descripción"}
          </label>
          <textarea
            value={formData.notes ?? ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder={t("session.notesPlaceholder") || "¿Qué habéis discutido?"}
            rows={8}
            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none min-h-[220px]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {t("sessionModal.cancel")}
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            {t("sessionModal.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
});
