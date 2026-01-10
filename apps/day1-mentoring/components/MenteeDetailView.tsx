"use client";

import { trackEvent } from "@miniapps/analytics";
import { ConfirmDialog } from "@miniapps/ui";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMenteeSessions, useMentoringData } from "../lib/hooks/useMentoringData";
import type { Mentee, Session, SessionFormInput } from "../lib/schemas";
import { extractMenteeId } from "../lib/slug";
import { MenteeDetail } from "./MenteeDetail";

// Track first session creation
let hasTrackedFirstValue = false;

interface MenteeDetailViewProps {
  menteeSlug: string;
}

export function MenteeDetailView({ menteeSlug }: MenteeDetailViewProps) {
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

  // Resolve menteeId from slug using mentees list
  const menteeId = useMemo(
    () => extractMenteeId(menteeSlug, data.mentees),
    [menteeSlug, data.mentees]
  );

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
    async (menteeToArchive: Mentee) => {
      const isArchiving = !menteeToArchive.archived;
      if (isArchiving) {
        await data.archiveMentee(menteeToArchive.id);
        trackEvent("mf_mentee_archived");
      } else {
        await data.unarchiveMentee(menteeToArchive.id);
      }
    },
    [data]
  );

  const handleDeleteMentee = useCallback(
    (menteeToDelete: Mentee) => {
      setConfirmDialog({
        open: true,
        title: t("confirm.deleteMenteeTitle"),
        message: t("confirm.deleteMenteeMessage"),
        onConfirm: async () => {
          await data.deleteMentee(menteeToDelete.id);
          trackEvent("mf_mentee_deleted", {
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
  const handleCreateInlineSession = useCallback(async () => {
    if (!menteeId) {
      return;
    }

    // Default values for new session
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0] ?? "";
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const input: SessionFormInput = {
      date: dateStr,
      time: timeStr,
      tags: [],
      nextSteps: [],
      isRemote: true,
      title: "",
      notes: "",
    };

    const session = await data.createSession(menteeId, input);

    if (session) {
      if (!hasTrackedFirstValue && data.sessions.length === 0) {
        trackEvent("mf_first_value");
        hasTrackedFirstValue = true;
      }
      trackEvent("mf_session_created", {
        nextStepsCount: 0,
        hasTags: false,
        method: "inline",
      });
    }
  }, [data, menteeId]);

  const handleDeleteSession = useCallback(
    (session: Session) => {
      setConfirmDialog({
        open: true,
        title: t("confirm.deleteSessionTitle"),
        message: t("confirm.deleteSessionMessage"),
        onConfirm: async () => {
          await data.deleteSession(session.id);
          trackEvent("mf_session_deleted");
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
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
          onNewSession={handleCreateInlineSession}
          onUpdateSession={async (sessionId, updates) => {
            await data.updateSession(sessionId, updates);
          }}
          onDeleteSession={handleDeleteSession}
        />
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
