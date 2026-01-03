"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { memo, useCallback } from "react";
import type { Mentee, MenteeFormInput, Session } from "../lib/schemas";
import { EditableField } from "./EditableField";
import { GoalInput } from "./GoalInput";
import { NoteInput } from "./NoteInput";
import { SessionCard } from "./SessionCard";

interface MenteeDetailProps {
  mentee: Mentee;
  sessions: Session[];
  onUpdate: (updates: Partial<MenteeFormInput>) => void;
  onArchive: () => void;
  onDelete: () => void;
  onNewSession: () => void;
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
  onDeleteSession: (session: Session) => void;
}

export const MenteeDetail = memo(function MenteeDetail({
  mentee,
  sessions,
  onUpdate,
  onArchive,
  onDelete,
  onNewSession,
  onUpdateSession,
  onDeleteSession,
}: MenteeDetailProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  const handleFieldChange = useCallback(
    (field: keyof MenteeFormInput, value: string | number | undefined | boolean) => {
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  if (!mentee || !mentee.name) {
    return (
      <div className="text-center py-20 text-gray-500 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200">
        {t("mentee.notFound")}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto space-y-10 pb-24 px-4 sm:px-8">
      {/* Profile Section */}
      <div className="relative p-8 sm:p-12 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm overflow-hidden">
        {/* Decorative background similar to Landing */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
          {/* Avatar Area */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-32 h-32 rounded-3xl flex items-center justify-center font-bold text-5xl shadow-lg ring-4 ring-white dark:ring-gray-800 ${
                mentee.archived
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gradient-to-br from-primary-400 to-primary-600 text-white"
              }`}
            >
              {mentee.name.charAt(0).toUpperCase()}
            </div>
            {mentee.archived && (
              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider rounded-full">
                {t("mentee.archived")}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div>
                <EditableField
                  value={mentee.name}
                  onChange={(value) => handleFieldChange("name", value)}
                  placeholder={t("mentee.namePlaceholder")}
                  className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight"
                  defaultEditing={isNew}
                />

                {/* Profession */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">💼</span>
                  <EditableField
                    value={mentee.profession || ""}
                    onChange={(v) => handleFieldChange("profession", v)}
                    placeholder={t("mentee.professionPlaceholder")}
                    className="text-lg text-gray-600 dark:text-gray-400 font-medium"
                  />
                </div>

                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3 text-gray-500">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 transition-colors whitespace-nowrap">
                    <span className="text-base">📅</span>
                    <EditableField
                      value={mentee.age?.toString() || ""}
                      onChange={(v) => handleFieldChange("age", v ? parseInt(v) : undefined)}
                      placeholder={t("mentee.agePlaceholder")}
                      className="font-semibold text-gray-900 dark:text-gray-100 w-20 text-center"
                    />
                    <span className="text-xs">{t("mentee.ageLabel")}</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 transition-colors">
                    <span className="text-base">📍</span>
                    <EditableField
                      value={mentee.location || ""}
                      onChange={(v) => handleFieldChange("location", v)}
                      placeholder={t("mentee.locationPlaceholder")}
                      className="font-semibold text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <button
                    onClick={() =>
                      handleFieldChange("inPersonAvailable", !mentee.inPersonAvailable)
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      mentee.inPersonAvailable
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400"
                        : "bg-gray-50 border-transparent text-gray-400 dark:bg-gray-800/50 dark:border-transparent dark:text-gray-500"
                    }`}
                  >
                    <span className="text-base">🤝</span>
                    <span className="text-xs font-semibold">{t("mentee.inPersonAvailable")}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onArchive}
                  className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm"
                  title={mentee.archived ? t("actions.unarchive") : t("actions.archive")}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 8V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                    <path d="M21 3H3" />
                    <path d="M10 12h4" />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                  title={t("actions.delete")}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contact Strip - Simplified */}
            <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
              {/* Phone Pill */}
              <div className="flex items-center gap-3 p-1.5 pr-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-lg">
                  📞
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1">
                      {t("mentee.phone")}
                    </span>
                    <button
                      onClick={() => handleFieldChange("hasWhatsapp", !mentee.hasWhatsapp)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-all ${
                        mentee.hasWhatsapp
                          ? "bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                          : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700/50 dark:border-gray-700 dark:text-gray-500"
                      }`}
                      title="WhatsApp"
                    >
                      {mentee.hasWhatsapp ? `WA: ${t("mentee.yes")}` : `WA: ${t("mentee.no")}`}
                    </button>
                  </div>
                  <EditableField
                    value={mentee.phone || ""}
                    onChange={(v) => handleFieldChange("phone", v)}
                    placeholder={t("mentee.phonePlaceholder")}
                    className="font-medium text-gray-700 dark:text-gray-300 min-w-[120px]"
                  />
                </div>
                {mentee.phone && mentee.hasWhatsapp && (
                  <>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
                    <a
                      href={`https://wa.me/${mentee.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white dark:bg-gray-700 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-105 transition-all shadow-sm"
                      title="WhatsApp"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </>
                )}
              </div>

              {/* Email Pill */}
              <div className="flex items-center gap-3 p-1.5 pr-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-lg">
                  ✉️
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1">
                    {t("mentee.email")}
                  </span>
                  <EditableField
                    value={mentee.email || ""}
                    onChange={(v) => handleFieldChange("email", v)}
                    placeholder={t("mentee.emailPlaceholder")}
                    className="font-medium text-gray-700 dark:text-gray-300 min-w-[150px]"
                  />
                </div>
                {mentee.email && (
                  <>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
                    <a
                      href={`mailto:${mentee.email}`}
                      className="p-2 rounded-lg bg-white dark:bg-gray-700 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:scale-105 transition-all shadow-sm"
                      title={t("actions.sendEmail")}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Availability Notes - Moved to Profile Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="text-lg">🕒</span> {t("mentee.availabilityNotes")}
          </h4>
          <EditableField
            value={mentee.availabilityNotes || ""}
            onChange={(v) => handleFieldChange("availabilityNotes", v)}
            placeholder={t("mentee.availabilityNotesPlaceholder")}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-transparent hover:border-gray-200 transition-all w-full"
          />
        </div>
      </div>
      <div className="space-y-8">
        {/* Goals */}
        <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              🎯
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("mentee.goals")}</h3>
          </div>
          <GoalInput goals={mentee.goals || []} onChange={(goals) => onUpdate({ goals })} />
        </section>

        {/* Notes */}
        <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              📝
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("mentee.notes")}</h3>
          </div>
          <NoteInput notes={mentee.notes || []} onChange={(notes) => onUpdate({ notes })} />
        </section>

        {/* Sessions */}
        <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                🗓️
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("mentee.sessions")}
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  {sessions.length} registradas
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                menteeName={mentee.name}
                onUpdate={(updates) => onUpdateSession(session.id, updates)}
                onDelete={() => onDeleteSession(session)}
              />
            ))}

            {/* New Session Card */}
            <button
              onClick={onNewSession}
              className="group relative min-h-[220px] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="mb-4 w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
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
                {t("mentee.newSession")}
              </p>
            </button>
          </div>
        </section>

        {/* Metadata Info - Bottom */}
        <div className="p-6 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3 opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t("mentee.createdAt")}</span>
            <span>{new Date(mentee.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t("mentee.updatedAt")}</span>
            <span>{new Date(mentee.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
