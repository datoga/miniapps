"use client";

import { memo, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Mentee, Session } from "../lib/schemas";

interface SearchModalProps {
  open: boolean;
  mentees: Mentee[];
  sessions: Session[];
  showArchived: boolean;
  onSelectMentee: (id: string) => void;
  onClose: () => void;
}

export const SearchModal = memo(function SearchModal({
  open,
  mentees,
  sessions,
  showArchived,
  onSelectMentee,
  onClose,
}: SearchModalProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return { mentees: [], sessions: [] };
    }

    const q = query.toLowerCase().trim();

    const matchingMentees = mentees.filter((m) => {
      if (!showArchived && m.archived) {
        return false;
      }
      const searchableText = [m.name, m.goal, m.notes, m.inPersonNotes, m.age?.toString(), ...m.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(q);
    });

    const matchingSessions = sessions.filter((s) => {
      const mentee = mentees.find((m) => m.id === s.menteeId);
      if (!showArchived && mentee?.archived) {
        return false;
      }
      const searchableText = [s.title, s.notes, ...s.tags, ...s.nextSteps.map((ns) => ns.text)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(q);
    });

    return {
      mentees: matchingMentees,
      sessions: matchingSessions.map((s) => ({
        ...s,
        menteeName: mentees.find((m) => m.id === s.menteeId)?.name ?? "Unknown",
      })),
    };
  }, [query, mentees, sessions, showArchived]);

  const handleMenteeClick = useCallback(
    (id: string) => {
      onSelectMentee(id);
      onClose();
    },
    [onSelectMentee, onClose]
  );

  const handleSessionClick = useCallback(
    (menteeId: string) => {
      onSelectMentee(menteeId);
      onClose();
    },
    [onSelectMentee, onClose]
  );

  if (!open) {
    return null;
  }

  const hasResults = results.mentees.length > 0 || results.sessions.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Search input */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="flex-1 bg-transparent text-lg text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
            />
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-auto p-2">
          {!hasQuery && (
            <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.searchPlaceholder")}
            </p>
          )}

          {hasQuery && !hasResults && (
            <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.noResults")}
            </p>
          )}

          {/* Mentees */}
          {results.mentees.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                {t("dashboard.menteesGroup")}
              </p>
              {results.mentees.map((mentee) => (
                <button
                  key={mentee.id}
                  onClick={() => handleMenteeClick(mentee.id)}
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{mentee.name}</span>
                    {mentee.archived && <span className="text-xs">📦</span>}
                  </div>
                  {mentee.goal && (
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{mentee.goal}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Sessions */}
          {results.sessions.length > 0 && (
            <div>
              <p className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                {t("dashboard.sessionsGroup")}
              </p>
              {results.sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session.menteeId)}
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{session.menteeName}</span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{session.date}</span>
                  </div>
                  {session.title && (
                    <p className="font-medium text-gray-900 dark:text-white">{session.title}</p>
                  )}
                  {session.notes && (
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{session.notes}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

