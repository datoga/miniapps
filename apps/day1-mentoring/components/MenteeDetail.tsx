"use client";

import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import type { Mentee, Session, MenteeFormInput } from "../lib/schemas";
import { SessionCard } from "./SessionCard";
import { EditableField } from "./EditableField";

interface MenteeDetailProps {
  mentee: Mentee;
  sessions: Session[];
  onUpdate: (updates: Partial<MenteeFormInput>) => void;
  onArchive: () => void;
  onDelete: () => void;
  onNewSession: () => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
}

export const MenteeDetail = memo(function MenteeDetail({
  mentee,
  sessions,
  onUpdate,
  onArchive,
  onDelete,
  onNewSession,
  onEditSession,
  onDeleteSession,
}: MenteeDetailProps) {
  const t = useTranslations();

  const handleFieldChange = useCallback(
    (field: keyof MenteeFormInput, value: string | number | undefined) => {
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

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
              <EditableField
                value={mentee.name}
                onChange={(value) => handleFieldChange("name", value)}
                placeholder={t("mentee.namePlaceholder")}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              />
              {mentee.archived && (
                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  {t("mentee.archived")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <EditableField
                value={mentee.age?.toString() || ""}
                onChange={(value) => handleFieldChange("age", value ? parseInt(value) : undefined)}
                placeholder={t("mentee.agePlaceholder")}
              />
              {mentee.inPersonNotes && (
                <span
                  className="cursor-help"
                  title={mentee.inPersonNotes}
                >
                  📍
                </span>
              )}
              {mentee.phone && (
                mentee.hasWhatsapp ? (
                  <a
                    href={`https://wa.me/${mentee.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                    title={`WhatsApp: ${mentee.phone}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                ) : (
                  <a
                    href={`tel:${mentee.phone}`}
                    className="hover:text-gray-700 dark:hover:text-gray-300"
                    title={mentee.phone}
                  >
                    📞
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
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
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            🎯 {t("mentee.goal")}
          </h3>
          <EditableField
            value={mentee.goal || ""}
            onChange={(value) => handleFieldChange("goal", value)}
            placeholder={t("mentee.goalPlaceholder")}
            multiline
            className="text-gray-700 dark:text-gray-300 leading-relaxed"
          />
        </div>

        {/* Notes (post-its) */}
        {mentee.notes && Array.isArray(mentee.notes) && mentee.notes.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              📝 {t("mentee.notes")}
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

        {/* Location */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            📍 {t("mentee.location")}
          </h3>
          <EditableField
            value={mentee.inPersonNotes || ""}
            onChange={(value) => handleFieldChange("inPersonNotes", value)}
            placeholder={t("mentee.locationPlaceholder")}
            className="text-gray-700 dark:text-gray-300 leading-relaxed"
          />
        </div>

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
