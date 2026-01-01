"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@miniapps/analytics";
import { Button } from "@miniapps/ui";
import {
  useMentoringData,
  useFilteredMentees,
  useMenteeSessions,
} from "../lib/hooks/useMentoringData";
import type { Mentee, Session, MenteeFormInput, SessionFormInput } from "../lib/schemas";
import { MenteeCard } from "./MenteeCard";
import { MenteeDetail } from "./MenteeDetail";
import { MenteeModal } from "./MenteeModal";
import { SessionModal } from "./SessionModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { SearchModal } from "./SearchModal";

// Track first session creation
let hasTrackedFirstValue = false;

interface DashboardProps {
  searchOpen: boolean;
  onSearchOpen: () => void;
  onSearchClose: () => void;
}

export function Dashboard({ searchOpen, onSearchClose }: DashboardProps) {
  const t = useTranslations();
  const data = useMentoringData();

  // Local UI state
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);

  // Modal states
  const [menteeModalOpen, setMenteeModalOpen] = useState(false);
  const [menteeToEdit, setMenteeToEdit] = useState<Mentee | null>(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Sync selected mentee with settings on load
  useState(() => {
    if (data.settings.lastSelectedMenteeId && !selectedMenteeId) {
      setSelectedMenteeId(data.settings.lastSelectedMenteeId);
    }
  });

  // Derived data
  const filteredMentees = useFilteredMentees(data.mentees, data.settings.showArchived, "");

  const selectedMentee = useMemo(
    () => data.mentees.find((m) => m.id === selectedMenteeId) ?? null,
    [data.mentees, selectedMenteeId]
  );

  const menteeSessions = useMenteeSessions(data.sessions, selectedMenteeId);

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
    async (id: string | null) => {
      setSelectedMenteeId(id);
      await data.setSelectedMenteeId(id);
    },
    [data]
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

  const handleOpenEditMentee = useCallback((mentee: Mentee) => {
    setMenteeToEdit(mentee);
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
            isInPersonAvailable: input.inPersonAvailable ?? false,
          });
          await handleSelectMentee(mentee.id);
        }
      }
      setMenteeModalOpen(false);
      setMenteeToEdit(null);
    },
    [data, menteeToEdit, handleSelectMentee]
  );

  const handleArchiveMentee = useCallback(
    (mentee: Mentee) => {
      const isArchiving = !mentee.archived;
      setConfirmDialog({
        open: true,
        title: isArchiving ? t("confirm.archiveTitle") : t("confirm.unarchiveTitle"),
        message: isArchiving ? t("confirm.archiveMessage") : t("confirm.unarchiveMessage"),
        onConfirm: async () => {
          if (isArchiving) {
            await data.archiveMentee(mentee.id);
            trackEvent("mentee_archived");
            if (selectedMenteeId === mentee.id && !data.settings.showArchived) {
              await handleSelectMentee(null);
            }
          } else {
            await data.unarchiveMentee(mentee.id);
          }
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [data, selectedMenteeId, t, handleSelectMentee]
  );

  const handleDeleteMentee = useCallback(
    (mentee: Mentee) => {
      setConfirmDialog({
        open: true,
        title: t("confirm.deleteMenteeTitle"),
        message: t("confirm.deleteMenteeMessage"),
        onConfirm: async () => {
          await data.deleteMentee(mentee.id);
          trackEvent("mentee_deleted", {
            menteesCount: data.mentees.length - 1,
          });
          if (selectedMenteeId === mentee.id) {
            await handleSelectMentee(null);
          }
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [data, selectedMenteeId, t, handleSelectMentee]
  );

  // Session handlers
  const handleOpenNewSession = useCallback(() => {
    setSessionToEdit(null);
    setSessionModalOpen(true);
  }, []);

  const handleOpenEditSession = useCallback((session: Session) => {
    setSessionToEdit(session);
    setSessionModalOpen(true);
  }, []);

  const handleSaveSession = useCallback(
    async (input: SessionFormInput) => {
      if (sessionToEdit) {
        await data.updateSession(sessionToEdit.id, input);
      } else if (selectedMenteeId) {
        const session = await data.createSession(selectedMenteeId, input);
        if (session) {
          if (!hasTrackedFirstValue && data.sessions.length === 0) {
            trackEvent("first_value");
            hasTrackedFirstValue = true;
          }
          trackEvent("session_created", {
            nextStepsCount: input.nextSteps.length,
            hasTags: input.tags.length > 0,
          });
        }
      }
      setSessionModalOpen(false);
      setSessionToEdit(null);
    },
    [data, sessionToEdit, selectedMenteeId]
  );

  const handleDeleteSession = useCallback(
    (session: Session) => {
      setConfirmDialog({
        open: true,
        title: t("confirm.deleteSessionTitle"),
        message: t("confirm.deleteSessionMessage"),
        onConfirm: async () => {
          await data.deleteSession(session.id);
          trackEvent("session_deleted");
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [data, t]
  );

  const handleBackToList = useCallback(() => {
    handleSelectMentee(null);
  }, [handleSelectMentee]);

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6">
        {selectedMentee ? (
          // Mentee detail view
          <div>
            <button
              onClick={handleBackToList}
              className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ← {t("dashboard.allMentees")}
            </button>
            <MenteeDetail
              mentee={selectedMentee}
              sessions={menteeSessions}
              onEdit={() => handleOpenEditMentee(selectedMentee)}
              onArchive={() => handleArchiveMentee(selectedMentee)}
              onDelete={() => handleDeleteMentee(selectedMentee)}
              onNewSession={handleOpenNewSession}
              onEditSession={handleOpenEditSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        ) : (
          // Mentee list view
          <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("dashboard.allMentees")}
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={data.settings.showArchived}
                    onChange={(e) => handleToggleShowArchived(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  {t("dashboard.showArchived")}
                </label>
                <Button onClick={handleOpenNewMentee}>+ {t("dashboard.newMentee")}</Button>
              </div>
            </div>

            {/* Mentee grid */}
            {filteredMentees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 text-6xl">👋</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {t("dashboard.noMentees")}
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  {t("dashboard.noMenteesDescription")}
                </p>
                <Button onClick={handleOpenNewMentee}>{t("dashboard.newMentee")}</Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMentees.map((mentee) => (
                  <MenteeCard
                    key={mentee.id}
                    mentee={mentee}
                    sessionsCount={sessionCounts[mentee.id] || 0}
                    lastSession={lastSessions[mentee.id]}
                    onClick={() => handleSelectMentee(mentee.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        mentees={data.mentees}
        sessions={data.sessions}
        showArchived={data.settings.showArchived}
        onSelectMentee={handleSelectMentee}
        onClose={onSearchClose}
      />

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

      <SessionModal
        open={sessionModalOpen}
        session={sessionToEdit}
        onSave={handleSaveSession}
        onClose={() => {
          setSessionModalOpen(false);
          setSessionToEdit(null);
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
