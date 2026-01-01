"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { trackEvent } from "@miniapps/analytics";
import {
  useMentoringData,
  useFilteredMentees,
} from "../lib/hooks/useMentoringData";
import type { Mentee, MenteeFormInput, Session } from "../lib/schemas";
import { MenteeCard } from "./MenteeCard";
import { MenteeModal } from "./MenteeModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { EditableField } from "./EditableField";

export function DashboardView() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const data = useMentoringData();

  // Modal states
  const [menteeModalOpen, setMenteeModalOpen] = useState(false);
  const [menteeToEdit, setMenteeToEdit] = useState<Mentee | null>(null);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Derived data
  const filteredMentees = useFilteredMentees(data.mentees, data.settings.showArchived, "");

  // Get session counts per mentee
  const sessionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.sessions.forEach((s) => {
      counts[s.menteeId] = (counts[s.menteeId] || 0) + 1;
    });
    return counts;
  }, [data.sessions]);

  // Get last session per mentee
  const lastSessions = useMemo(() => {
    const sessions: Record<string, Session> = {};
    data.sessions.forEach((s) => {
      const existing = sessions[s.menteeId];
      if (!existing || s.date > existing.date) {
        sessions[s.menteeId] = s;
      }
    });
    return sessions;
  }, [data.sessions]);

  // Handlers
  const handleSelectMentee = useCallback(
    (id: string) => {
      router.push(`/${locale}/dashboard/${id}`);
    },
    [router, locale]
  );

  const handleToggleShowArchived = useCallback(
    async (show: boolean) => {
      await data.setShowArchived(show);
    },
    [data]
  );

  // Mentee handlers
  const handleOpenNewMentee = useCallback(() => {
    setMenteeToEdit(null);
    setMenteeModalOpen(true);
  }, []);

  const handleSaveMentee = useCallback(
    async (input: MenteeFormInput) => {
      if (menteeToEdit) {
        await data.updateMentee(menteeToEdit.id, input);
      } else {
        const mentee = await data.createMentee(input);
        if (mentee) {
          trackEvent("mentee_created", {
            hasTags: input.tags.length > 0,
            hasGoal: !!input.goal,
          });
          // Navigate to the new mentee
          router.push(`/${locale}/dashboard/${mentee.id}`);
        }
      }
      setMenteeModalOpen(false);
      setMenteeToEdit(null);
    },
    [data, menteeToEdit, router, locale]
  );

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <EditableField
              value={data.settings.programName}
              onChange={(name) => data.setProgramName(name)}
              placeholder={t("dashboard.programNamePlaceholder")}
              className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
            />
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {filteredMentees.length}
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={data.settings.showArchived}
              onChange={(e) => handleToggleShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
            />
            {t("dashboard.showArchived")}
          </label>
        </div>

        {/* Mentee grid - always show with add card */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMentees.map((mentee) => (
            <MenteeCard
              key={mentee.id}
              mentee={mentee}
              sessionsCount={sessionCounts[mentee.id] || 0}
              lastSession={lastSessions[mentee.id]}
              onClick={() => handleSelectMentee(mentee.id)}
            />
          ))}
          {/* Add new mentee card */}
          <button
            onClick={handleOpenNewMentee}
            className="group w-full rounded-2xl p-5 text-left transition-all duration-200 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 min-h-[180px] flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 flex items-center justify-center transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {t("dashboard.newMentee")}
            </span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <MenteeModal
        open={menteeModalOpen}
        mentee={menteeToEdit}
        onSave={handleSaveMentee}
        onClose={() => {
          setMenteeModalOpen(false);
          setMenteeToEdit(null);
        }}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}

