"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import type { Session, SessionFormInput, NextStep } from "../lib/schemas";
import { EditableField } from "./EditableField";

interface SessionCardProps {
  session: Session;
  menteeName: string;
  onUpdate: (updates: Partial<SessionFormInput>) => void;
  onDelete: () => void;
  onToggleStep?: (stepId: string, done: boolean) => void;
}

export const SessionCard = memo(function SessionCard({
  session,
  menteeName,
  onUpdate,
  onDelete,
  onToggleStep,
}: SessionCardProps) {
  const t = useTranslations();
  const [newStepText, setNewStepText] = useState("");

  const completedSteps = session.nextSteps.filter((s) => s.done).length;
  const totalSteps = session.nextSteps.length;

  // Check if session is in the future
  const isFutureSession = useMemo(() => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate >= today;
  }, [session.date]);

  // Generate Google Calendar URL
  const calendarUrl = useMemo(() => {
    const dateStr = session.date.replace(/-/g, "");

    const title = encodeURIComponent(
      session.title
        ? `${session.title} - ${menteeName}`
        : `Sesión con ${menteeName}`
    );

    const details = encodeURIComponent(
      [
        session.notes,
        session.nextSteps.length > 0
          ? `\n\nPróximos pasos:\n${session.nextSteps.map(s => `- ${s.text}`).join("\n")}`
          : ""
      ].filter(Boolean).join("")
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;
  }, [session, menteeName]);

  const handleAddToCalendar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(calendarUrl, "_blank");
  }, [calendarUrl]);

  const handleAddStep = useCallback(() => {
    if (!newStepText.trim()) return;

    const newStep: NextStep = {
      id: uuidv4(),
      text: newStepText.trim(),
      done: false,
    };

    onUpdate({ nextSteps: [...session.nextSteps, newStep] });
    setNewStepText("");
  }, [newStepText, session.nextSteps, onUpdate]);

  const handleRemoveStep = useCallback((stepId: string) => {
    onUpdate({ nextSteps: session.nextSteps.filter(s => s.id !== stepId) });
  }, [session.nextSteps, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddStep();
    }
  }, [handleAddStep]);

  return (
    <div className="group rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          {/* Date */}
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={session.date}
              onChange={(e) => onUpdate({ date: e.target.value })}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary-400 rounded cursor-pointer"
            />
            {isFutureSession && (
              <button
                onClick={handleAddToCalendar}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                title={t("session.addToCalendar")}
              >
                📅
              </button>
            )}
          </div>

          {/* Title */}
          <EditableField
            value={session.title || ""}
            onChange={(value) => onUpdate({ title: value })}
            placeholder={t("session.titlePlaceholder")}
            className="font-medium text-gray-900 dark:text-white"
          />

          {/* Notes */}
          <EditableField
            value={session.notes || ""}
            onChange={(value) => onUpdate({ notes: value })}
            placeholder={t("session.notesPlaceholder")}
            multiline
            className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
          />
        </div>

        <button
          onClick={onDelete}
          className="ml-4 rounded-lg px-2 py-1 text-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title={t("actions.delete")}
        >
          🗑️
        </button>
      </div>

      {/* Next steps */}
      <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">{t("session.nextSteps")}</span>
          {totalSteps > 0 && (
            <span className="text-gray-400 dark:text-gray-500">
              {completedSteps}/{totalSteps}
            </span>
          )}
        </div>

        {totalSteps > 0 && (
          <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        )}

        <ul className="space-y-1">
          {session.nextSteps.map((step) => (
            <li key={step.id} className="flex items-center gap-2 text-sm group/step">
              <button
                type="button"
                onClick={() => onToggleStep?.(step.id, !step.done)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                {step.done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors" />
                )}
              </button>
              <span className={`flex-1 ${step.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}`}>
                {step.text}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveStep(step.id)}
                className="opacity-0 group-hover/step:opacity-100 text-red-400 hover:text-red-500 transition-all"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {/* Add new step */}
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("session.addStepPlaceholder")}
            className="flex-1 text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
          <button
            type="button"
            onClick={handleAddStep}
            disabled={!newStepText.trim()}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Tags */}
      {session.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
