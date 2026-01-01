"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { Mentee, Session } from "../lib/schemas";

interface MenteeCardProps {
  mentee: Mentee;
  sessionsCount: number;
  lastSession?: Session;
  onClick: () => void;
}

export const MenteeCard = memo(function MenteeCard({
  mentee,
  sessionsCount,
  lastSession,
  onClick,
}: MenteeCardProps) {
  const t = useTranslations();

  const isArchived = mentee.archived;

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-2xl p-5 text-left transition-all duration-200 border ${
        isArchived
          ? "bg-amber-50/50 border-amber-200/50 hover:border-amber-300 dark:bg-amber-900/10 dark:border-amber-800/30 dark:hover:border-amber-700/50"
          : "bg-white border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:shadow-none"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {mentee.image ? (
            <img
              src={mentee.image}
              alt={mentee.name}
              className={`w-10 h-10 rounded-full object-cover shadow-sm ${
                isArchived ? "opacity-70" : ""
              }`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm shadow-sm ${
              isArchived
                ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900"
                : "bg-gradient-to-br from-primary-400 to-primary-600 text-white"
            }`}>
              {mentee.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className={`font-semibold transition-colors ${
              isArchived
                ? "text-amber-800 dark:text-amber-300"
                : "text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
            }`}>
              {mentee.name}
            </h3>
            {mentee.age && (
              <span className={`text-xs ${isArchived ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
                {mentee.age} años
              </span>
            )}
          </div>
        </div>
        {isArchived && (
          <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded font-medium">
            {t("mentee.archived")}
          </span>
        )}
      </div>

      {/* Goal */}
      {mentee.goal && (
        <p className={`text-sm line-clamp-2 mb-3 leading-relaxed ${
          isArchived ? "text-amber-700 dark:text-amber-400/80" : "text-gray-600 dark:text-gray-400"
        }`}>
          {mentee.goal}
        </p>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between pt-3 border-t ${
        isArchived ? "border-amber-200/50 dark:border-amber-800/30" : "border-gray-100 dark:border-gray-700/50"
      }`}>
        <div className={`flex items-center gap-3 text-xs ${
          isArchived ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"
        }`}>
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {sessionsCount}
          </span>
          {lastSession && (
            <span className={isArchived ? "text-amber-500 dark:text-amber-500" : "text-gray-400 dark:text-gray-500"}>
              {lastSession.date}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(mentee.location || mentee.inPersonNotes) && (
            <span className="cursor-help text-sm" title={mentee.location || mentee.inPersonNotes}>🌐</span>
          )}
          {mentee.inPersonAvailable && (
            <span className="cursor-help text-sm text-green-600 dark:text-green-500" title={mentee.availabilityNotes || "Disponible presencial"}>🤝</span>
          )}
          {mentee.phone && (
            mentee.hasWhatsapp ? (
              <span className="text-green-500" title={`WhatsApp: ${mentee.phone}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </span>
            ) : (
              <span className="cursor-help text-sm" title={mentee.phone}>📞</span>
            )
          )}
          {mentee.email && (
            <span className="cursor-help text-sm" title={mentee.email}>✉️</span>
          )}
        </div>
      </div>

      {/* Tags */}
      {mentee.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentee.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs rounded-md ${
                isArchived
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {tag}
            </span>
          ))}
          {mentee.tags.length > 3 && (
            <span className={`text-xs ${isArchived ? "text-amber-500" : "text-gray-400"}`}>
              +{mentee.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
});
