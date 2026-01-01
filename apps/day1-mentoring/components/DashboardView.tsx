"use client";

import { trackEvent } from "@miniapps/analytics";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useFilteredMentees, useMentoringData } from "../lib/hooks/useMentoringData";
import type { Mentee, MenteeFormInput, Session } from "../lib/schemas";
import { buildMenteeSlug } from "../lib/slug";
import { ConfirmDialog } from "./ConfirmDialog";
import { EditableField } from "./EditableField";
import { MenteeCard } from "./MenteeCard";

export function DashboardView() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const data = useMentoringData();

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

  // Get next session per mentee (closest future session)
  const nextSessions = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    const sessions: Record<string, Session> = {};

    data.sessions.forEach((s) => {
      // Check if session is in the future
      const isFutureDate = s.date > todayStr;
      const isToday = s.date === todayStr;
      const isFutureTime = !s.time || s.time > currentTimeStr;

      if (isFutureDate || (isToday && isFutureTime)) {
        const existing = sessions[s.menteeId];
        // If we want the closest one, we want the smallest date (and smallest time if dates equal)
        if (!existing) {
          sessions[s.menteeId] = s;
        } else {
          // Compare dates
          if (s.date < existing.date) {
            sessions[s.menteeId] = s;
          } else if (s.date === existing.date) {
            // Same date, compare times
            // If existing has no time (all day), and new has time, new is more specific? Or prefer earlier?
            // Let's assume simple string compare: "10:00" < "12:00". Empty time "" is usually treated as "start of day" or "all day".
            // If s.time is empty, it's < existing.time (non-empty).
            // Actually if s.time is empty, let's assume it is "00:00" for sorting, so it comes first?
            // Or maybe last? Let's just stick to simple comparison:
            // If new time is earlier than existing time, swap.
            const newTime = s.time || "23:59"; // If no time, treat as end of day? Or start?
            const existingTime = existing.time || "23:59";

            if (newTime < existingTime) {
              sessions[s.menteeId] = s;
            }
          }
        }
      }
    });
    return sessions;
  }, [data.sessions]);

  // Handlers
  const handleSelectMentee = useCallback(
    (slug: string) => {
      router.push(`/${locale}/dashboard/${slug}`);
    },
    [router, locale]
  );

  const handleToggleShowArchived = useCallback(
    async (show: boolean) => {
      await data.setShowArchived(show);
    },
    [data]
  );

  const handleNewMentee = useCallback(async () => {
    const mentee = await data.createMentee({
      name: "Nuevo Mentee",
      goals: [],
      notes: [],
      tags: [],
    } as MenteeFormInput);

    if (mentee) {
      trackEvent("mentee_created", {
        hasTags: false,
        hasGoals: false,
      });
      // Navigate to the new mentee
      router.push(`/${locale}/dashboard/${buildMenteeSlug(mentee)}?new=true`);
    }
  }, [data, router, locale]);

  const handleArchiveMentee = useCallback(
    async (mentee: Mentee) => {
      // Cast to MenteeFormInput but include archived which is now in the schema
      const update = { archived: !mentee.archived } as MenteeFormInput;
      await data.updateMentee(mentee.id, update);
    },
    [data]
  );

  const handleDeleteMentee = useCallback(
    (mentee: Mentee) => {
      setConfirmDialog({
        open: true,
        title: t("confirm.deleteMenteeTitle"),
        message: t("confirm.deleteMenteeMessage"),
        onConfirm: async () => {
          await data.deleteMentee(mentee.id);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [data, t]
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
      <div className="min-h-screen relative">
        {/* Background Gradients from Landing */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-accent-50/30 dark:from-primary-950/20 dark:via-transparent dark:to-accent-950/10 -z-10 pointer-events-none" />
        <div className="fixed top-20 left-10 w-96 h-96 bg-primary-200/20 dark:bg-primary-800/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="fixed bottom-20 right-10 w-96 h-96 bg-accent-200/20 dark:bg-accent-800/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
          {/* Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <EditableField
                  value={data.settings.programName}
                  onChange={(name) => data.setProgramName(name)}
                  placeholder={t("dashboard.programNamePlaceholder")}
                  className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight"
                />
                <span className="flex items-center justify-center h-7 px-3 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                  {filteredMentees.length} mentees
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
                {t("dashboard.subtitle") ||
                  "Gestiona tus sesiones de mentoría y el crecimiento de tus mentees."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-3 group px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-white hover:shadow-sm transition-all">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {t("dashboard.showArchived")}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={data.settings.showArchived}
                    onChange={(e) => handleToggleShowArchived(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-500 transition-all" />
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            </div>
          </div>

          {/* Mentee grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMentees.map((mentee) => (
              <MenteeCard
                key={mentee.id}
                mentee={mentee}
                sessionsCount={sessionCounts[mentee.id] || 0}
                nextSession={nextSessions[mentee.id]}
                onClick={() => handleSelectMentee(buildMenteeSlug(mentee))}
                onArchive={() => handleArchiveMentee(mentee)}
                onDelete={() => handleDeleteMentee(mentee)}
              />
            ))}

            {/* Add new mentee card */}
            <button
              onClick={handleNewMentee}
              className="group relative min-h-[280px] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary-400 dark:hover:border-primary-600 bg-white/30 dark:bg-gray-900/30 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="mb-4 w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400 group-hover:text-primary-500 transition-colors"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {t("dashboard.newMentee")}
              </p>
              <p className="text-sm text-gray-500 max-w-[200px] mt-1">
                {t("dashboard.newMenteeLabel") || "Añade un nuevo mentee para empezar"}
              </p>
            </button>
          </div>
        </div>
      </div>

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
