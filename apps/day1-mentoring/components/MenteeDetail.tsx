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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          {mentee.image ? (
            <img
              src={mentee.image}
              alt={mentee.name}
              className="w-14 h-14 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
              {mentee.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{mentee.name}</h2>
              {mentee.archived && (
                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  {t("mentee.archived")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              {mentee.age && <span>{mentee.age} años</span>}
              {mentee.inPersonAvailable && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Presencial
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            ✏️ {t("actions.edit")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onArchive}>
            {mentee.archived ? "📤 " + t("actions.unarchive") : "📦 " + t("actions.archive")}
          </Button>
          {mentee.archived && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
              🗑️ {t("actions.delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Goal */}
        {mentee.goal && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t("mentee.goal")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{mentee.goal}</p>
          </div>
        )}

        {/* Notes (post-its) */}
        {mentee.notes && mentee.notes.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t("mentee.notes")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {mentee.notes.map((note) => {
                const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
                  yellow: { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-900" },
                  pink: { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-900" },
                  blue: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-900" },
                  green: { bg: "bg-green-100", border: "border-green-300", text: "text-green-900" },
                  purple: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-900" },
                };
                const colors = colorClasses[note.color] || colorClasses["yellow"];
                return (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg shadow-md border-2 ${colors.bg} ${colors.border} max-w-[200px] min-w-[120px] transform hover:-rotate-1 transition-transform`}
                  >
                    <p className={`text-sm ${colors.text} whitespace-pre-wrap`}>{note.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* In-person notes */}
        {mentee.inPersonNotes && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t("mentee.inPersonNotes")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{mentee.inPersonNotes}</p>
          </div>
        )}

        {/* Tags */}
        {mentee.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mentee.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Sessions section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("mentee.sessions")}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({sessions.length})
              </span>
            </h3>
            <Button size="sm" onClick={onNewSession}>
              + {t("mentee.newSession")}
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">{t("mentee.noSessions")}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{t("mentee.noSessionsDescription")}</p>
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
      </div>

      {/* Metadata */}
      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 flex gap-4">
        <span>{t("mentee.createdAt")}: {new Date(mentee.createdAt).toLocaleDateString()}</span>
        <span>{t("mentee.updatedAt")}: {new Date(mentee.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
});
