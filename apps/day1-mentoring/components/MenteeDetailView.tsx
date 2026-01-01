"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { trackEvent } from "@miniapps/analytics";
import {
  useMentoringData,
  useMenteeSessions,
} from "../lib/hooks/useMentoringData";
import type { Mentee, Session, MenteeFormInput, SessionFormInput } from "../lib/schemas";
import { MenteeDetail } from "./MenteeDetail";
import { SessionModal } from "./SessionModal";
import { ConfirmDialog } from "./ConfirmDialog";

// Track first session creation
let hasTrackedFirstValue = false;

interface MenteeDetailViewProps {
  menteeId: string;
}

export function MenteeDetailView({ menteeId }: MenteeDetailViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const data = useMentoringData();

  // Modal states
  const [sessionModalOpen, setSessionModalOpen] = useState(false);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Get the mentee
  const mentee = useMemo(
    () => data.mentees.find((m) => m.id === menteeId) ?? null,
    [data.mentees, menteeId]
  );

  const menteeSessions = useMenteeSessions(data.sessions, menteeId);

  // Redirect to dashboard if mentee not found (after loading)
  useEffect(() => {
    if (!data.isLoading && !mentee) {
      router.push(`/${locale}/dashboard`);
    }
  }, [data.isLoading, mentee, router, locale]);

  // Handlers
  const handleBackToList = useCallback(() => {
    router.push(`/${locale}/dashboard`);
  }, [router, locale]);

  const handleArchiveMentee = useCallback(
    (menteeToArchive: Mentee) => {
      const isArchiving = !menteeToArchive.archived;
      setConfirmDialog({
        open: true,
        title: isArchiving ? t("confirm.archiveTitle") : t("confirm.unarchiveTitle"),
        message: isArchiving ? t("confirm.archiveMessage") : t("confirm.unarchiveMessage"),
        onConfirm: async () => {
          if (isArchiving) {
            await data.archiveMentee(menteeToArchive.id);
            trackEvent("mentee_archived");
          } else {
            await data.unarchiveMentee(menteeToArchive.id);
          }
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [data, t]
  );

  const handleDeleteMentee = useCallback(
    (menteeToDelete: Mentee) => {
      setConfirmDialog({
        open: true,
        title: t("confirm.deleteMenteeTitle"),
        message: t("confirm.deleteMenteeMessage"),
        onConfirm: async () => {
          await data.deleteMentee(menteeToDelete.id);
          trackEvent("mentee_deleted", {
            menteesCount: data.mentees.length - 1,
          });
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          // Navigate back to dashboard after delete
          router.push(`/${locale}/dashboard`);
        },
      });
    },
    [data, t, router, locale]
  );

  // Session handlers
  const handleOpenNewSession = useCallback(() => {
    setSessionModalOpen(true);
  }, []);

  const handleSaveSession = useCallback(
    async (input: SessionFormInput) => {
      if (menteeId) {
        const session = await data.createSession(menteeId, input);
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
    },
    [data, menteeId]
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

  const handleToggleStep = useCallback(
    async (sessionId: string, stepId: string, done: boolean) => {
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const updatedNextSteps = session.nextSteps.map((step) =>
        step.id === stepId ? { ...step, done } : step
      );

      await data.updateSession(sessionId, { nextSteps: updatedNextSteps });
    },
    [data]
  );

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!mentee) {
    return null;
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <button
          onClick={handleBackToList}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {data.settings.programName}
        </button>
        <MenteeDetail
          mentee={mentee}
          sessions={menteeSessions}
          onUpdate={async (updates) => {
            await data.updateMentee(mentee.id, updates);
          }}
          onArchive={() => handleArchiveMentee(mentee)}
          onDelete={() => handleDeleteMentee(mentee)}
          onNewSession={handleOpenNewSession}
          onUpdateSession={async (sessionId, updates) => {
            await data.updateSession(sessionId, updates);
          }}
          onDeleteSession={handleDeleteSession}
          onToggleStep={handleToggleStep}
        />
      </div>

      {/* Session Modal */}
      <SessionModal
        open={sessionModalOpen}
        session={null}
        onSave={handleSaveSession}
        onClose={() => {
          setSessionModalOpen(false);
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

