"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback } from "react";
import type { Session, SessionFormInput } from "../lib/schemas";
import { EditableField } from "./EditableField";

interface SessionCardProps {
  session: Session;
  menteeName: string;
  onUpdate: (data: Partial<SessionFormInput>) => void;
  onDelete: () => void;
}

export const SessionCard = memo(function SessionCard({
  session,
  menteeName,
  onUpdate,
  onDelete,
}: SessionCardProps) {
  const t = useTranslations();

  const handleAddToCalendar = useCallback(() => {
    // Format date for Google Calendar: YYYYMMDD
    const cleanDate = session.date.replace(/-/g, "");

    // Parse time or default to 10:00
    const timeToParse = session.time || "10:00";
    const parts = timeToParse.split(":");
    const startHour = (parts[0] || "10").padStart(2, "0");
    const startMin = (parts[1] || "00").padStart(2, "0");

    // Default to 1 hour duration
    const endHour = String((parseInt(startHour) + 1) % 24).padStart(2, "0");

    const startDate = `${cleanDate}T${startHour}${startMin}00Z`;
    const endDate = `${cleanDate}T${endHour}${startMin}00Z`;

    const title = encodeURIComponent(`Sesión: ${menteeName}`);
    const details = encodeURIComponent(session.notes || "");

    let url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&dates=${startDate}/${endDate}&details=${details}`;

    if (session.isRemote) {
      url += "&vcon=meet";
    }

    window.open(url, "_blank");
  }, [session, menteeName]);

  return (
    <div className="group p-6 flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 dark:border-gray-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-transparent hover:border-gray-200 transition-all">
            <span className="text-lg">🗓️</span>
            <input
              type="date"
              value={session.date}
              onChange={(e) => onUpdate({ date: e.target.value })}
              className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer w-[110px]"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-transparent hover:border-gray-200 transition-all">
            <span className="text-lg">🕒</span>
            <input
              type="time"
              value={session.time || ""}
              onChange={(e) => onUpdate({ time: e.target.value })}
              className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {new Date(`${session.date}T00:00:00`) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
            <button
              onClick={handleAddToCalendar}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
              title={t("session.addToCalendar")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M12 11v6M9 14h6" />
              </svg>
            </button>
          )}

          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
            title={t("actions.delete")}
          >
            <svg
              width="18"
              height="18"
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

      <div className="flex-1">
        <EditableField
          value={session.notes || ""}
          onChange={(value) => onUpdate({ notes: value })}
          placeholder={t("session.notesPlaceholder")}
          multiline
          className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed min-h-[100px] px-0"
        />
      </div>
    </div>
  );
});
