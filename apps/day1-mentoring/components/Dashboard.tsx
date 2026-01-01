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
import { Sidebar } from "./Sidebar";
import { MenteeDetail } from "./MenteeDetail";
import { MenteeModal } from "./MenteeModal";
import { SessionModal } from "./SessionModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { SearchResults } from "./SearchResults";
import { BackupPanel } from "./BackupPanel";

// Track first session creation
let hasTrackedFirstValue = false;

export function Dashboard() {
  const t = useTranslations();
  const data = useMentoringData();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);

  // Modal states
  const [menteeModalOpen, setMenteeModalOpen] = useState(false);
  const [menteeToEdit, setMenteeToEdit] = useState<Mentee | null>(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [backupPanelOpen, setBackupPanelOpen] = useState(false);

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
  const filteredMentees = useFilteredMentees(
    data.mentees,
    data.settings.showArchived,
    "" // Don't filter by search in sidebar - we'll show search results in main panel
  );

  const selectedMentee = useMemo(
    () => data.mentees.find((m) => m.id === selectedMenteeId) ?? null,
    [data.mentees, selectedMenteeId]
  );

  const menteeSessions = useMenteeSessions(data.sessions, selectedMenteeId);

  // Check if we're in search mode
  const isSearching = searchQuery.trim().length > 0;

  // Search results
  const searchResults = useMemo(() => {
    if (!isSearching) {
      return { mentees: [], sessions: [] };
    }

    const q = searchQuery.toLowerCase().trim();
    const showArchived = data.settings.showArchived;

    // Filter mentees
    let matchingMentees = data.mentees.filter((m) => {
      if (!showArchived && m.archived) {
        return false;
      }
      // If a specific mentee is selected, only search within that mentee
      if (selectedMenteeId && m.id !== selectedMenteeId) {
        return false;
      }
      const searchableText = [
        m.name,
        m.goal,
        m.notes,
        m.inPersonNotes,
        m.age?.toString(),
        ...m.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(q);
    });

    // Filter sessions
    let matchingSessions = data.sessions.filter((s) => {
      // If a specific mentee is selected, only show their sessions
      if (selectedMenteeId && s.menteeId !== selectedMenteeId) {
        return false;
      }
      // Check if mentee is archived
      const mentee = data.mentees.find((m) => m.id === s.menteeId);
      if (!showArchived && mentee?.archived) {
        return false;
      }
      const searchableText = [
        s.title,
        s.notes,
        ...s.tags,
        ...s.nextSteps.map((ns) => ns.text),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(q);
    });

    return {
      mentees: matchingMentees,
      sessions: matchingSessions.map((s) => ({
        ...s,
        menteeName: data.mentees.find((m) => m.id === s.menteeId)?.name ?? "Unknown",
      })),
    };
  }, [isSearching, searchQuery, data.mentees, data.sessions, data.settings.showArchived, selectedMenteeId]);

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
        // Edit
        await data.updateMentee(menteeToEdit.id, input);
      } else {
        // Create
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
            // If the archived mentee was selected, deselect
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
        // Edit
        await data.updateSession(sessionToEdit.id, input);
      } else if (selectedMenteeId) {
        // Create
        const session = await data.createSession(selectedMenteeId, input);
        if (session) {
          // Track first value event
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

  // Search result click handlers
  const handleSearchMenteeClick = useCallback(
    (mentee: Mentee) => {
      handleSelectMentee(mentee.id);
      setSearchQuery("");
    },
    [handleSelectMentee]
  );

  const handleSearchSessionClick = useCallback(
    (session: Session & { menteeName: string }) => {
      handleSelectMentee(session.menteeId);
      setSearchQuery("");
    },
    [handleSelectMentee]
  );

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        mentees={filteredMentees}
        selectedMenteeId={selectedMenteeId}
        showArchived={data.settings.showArchived}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectMentee={handleSelectMentee}
        onToggleShowArchived={handleToggleShowArchived}
        onNewMentee={handleOpenNewMentee}
        onOpenBackup={() => setBackupPanelOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {isSearching ? (
          <SearchResults
            mentees={searchResults.mentees}
            sessions={searchResults.sessions}
            onMenteeClick={handleSearchMenteeClick}
            onSessionClick={handleSearchSessionClick}
          />
        ) : selectedMentee ? (
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
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">👋</div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {t("dashboard.selectMentee")}
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              {t("dashboard.selectMenteeDescription")}
            </p>
            <Button onClick={handleOpenNewMentee}>{t("dashboard.newMentee")}</Button>
          </div>
        )}
      </main>

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

      <BackupPanel
        open={backupPanelOpen}
        mentees={data.mentees}
        sessions={data.sessions}
        onImport={data.replaceAll}
        onClose={() => setBackupPanelOpen(false)}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

