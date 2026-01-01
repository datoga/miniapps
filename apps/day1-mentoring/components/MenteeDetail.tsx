"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import type { Mentee, Session } from "../lib/schemas";
import { SessionCard } from "./SessionCard";

interface MenteeDetailProps {
  mentee: Mentee;
  sessions: Session[];
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onNewSession: () => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
}

export const MenteeDetail = memo(function MenteeDetail({
  mentee,
  sessions,
  onEdit,
  onArchive,
  onDelete,
  onNewSession,
  onEditSession,
  onDeleteSession,
}: MenteeDetailProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{mentee.name}</h2>
            {mentee.archived && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                {t("mentee.archived")}
              </span>
            )}
          </div>
          {mentee.age && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t("mentee.age")}: {mentee.age}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            {t("actions.edit")}
          </Button>
          <Button variant="secondary" size="sm" onClick={onArchive}>
            {mentee.archived ? t("actions.unarchive") : t("actions.archive")}
          </Button>
          <Button variant="secondary" size="sm" onClick={onDelete}>
            {t("actions.delete")}
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* In-person availability */}
        {(mentee.inPersonAvailable !== undefined || mentee.inPersonNotes) && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              {t("mentee.inPersonAvailable")}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  mentee.inPersonAvailable ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {mentee.inPersonAvailable ? "Yes" : "No"}
              </span>
            </div>
            {mentee.inPersonNotes && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {mentee.inPersonNotes}
              </p>
            )}
          </div>
        )}

        {/* Goal */}
        {mentee.goal && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              {t("mentee.goal")}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{mentee.goal}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {mentee.notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            {t("mentee.notes")}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {mentee.notes}
          </p>
        </div>
      )}

      {/* Tags */}
      {mentee.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentee.tags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Sessions section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("mentee.sessions")} ({sessions.length})
          </h3>
          <Button size="sm" onClick={onNewSession}>
            {t("mentee.newSession")}
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">{t("mentee.noSessions")}</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {t("mentee.noSessionsDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={() => onEditSession(session)}
                onDelete={() => onDeleteSession(session)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 dark:text-gray-500">
        <p>
          {t("mentee.createdAt")}: {new Date(mentee.createdAt).toLocaleDateString()}
        </p>
        <p>
          {t("mentee.updatedAt")}: {new Date(mentee.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
});

