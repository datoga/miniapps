"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Cycle, Session, UnitsUI, RestPeriod } from "@/lib/schemas";
import { formatWeight } from "@/lib/math";

interface ExerciseCalendarProps {
  sessions: Session[];
  cycles: Cycle[];
  restHistory: RestPeriod[];
  currentRest?: { startDate: string; endDate?: string };
  unitsUI: UnitsUI;
  onEditSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditCycle: (cycle: Cycle) => void;
  onDeleteCycle: (cycleId: string) => void;
  onEditRest: (rest: RestPeriod) => void;
  onDeleteRest: (restId: string) => void;
}

type EventType = "session" | "cycle-start" | "cycle-end" | "rest-start" | "rest-end" | "rest-day";

interface DayEvent {
  type: EventType;
  session?: Session;
  cycle?: Cycle;
  rest?: RestPeriod;
  isCurrentRest?: boolean;
}

export function ExerciseCalendar({
  sessions,
  cycles,
  restHistory,
  currentRest,
  unitsUI,
  onEditSession,
  onDeleteSession,
  onEditCycle,
  onDeleteCycle,
  onEditRest,
  onDeleteRest,
}: ExerciseCalendarProps) {
  const t = useTranslations();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build events map by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DayEvent[]>();

    const addEvent = (dateStr: string, event: DayEvent) => {
      const existing = map.get(dateStr) || [];
      existing.push(event);
      map.set(dateStr, existing);
    };

    // Add sessions
    sessions.forEach((session) => {
      const dateStr = session.datetime.split("T")[0];
      if (dateStr) {
        addEvent(dateStr, { type: "session", session });
      }
    });

    // Add cycle events
    cycles.forEach((cycle) => {
      const startDate = new Date(cycle.startedAt).toISOString().split("T")[0];
      if (startDate) {
        addEvent(startDate, { type: "cycle-start", cycle });
      }
      if (cycle.endedAt) {
        const endDate = new Date(cycle.endedAt).toISOString().split("T")[0];
        if (endDate) {
          addEvent(endDate, { type: "cycle-end", cycle });
        }
      }
    });

    // Add historical rest periods
    restHistory.forEach((rest) => {
      addEvent(rest.startDate, { type: "rest-start", rest });
      if (rest.actualEndDate) {
        addEvent(rest.actualEndDate, { type: "rest-end", rest });
      }
      // Add rest-day for each day in between
      const start = new Date(rest.startDate);
      const end = rest.actualEndDate ? new Date(rest.actualEndDate) : new Date();
      const current = new Date(start);
      current.setDate(current.getDate() + 1);
      while (current < end) {
        const dateStr = current.toISOString().split("T")[0];
        if (dateStr) {
          addEvent(dateStr, { type: "rest-day", rest });
        }
        current.setDate(current.getDate() + 1);
      }
    });

    // Add current rest period
    if (currentRest) {
      addEvent(currentRest.startDate, { type: "rest-start", isCurrentRest: true });
      // Add rest-day for each day from start to today
      const start = new Date(currentRest.startDate);
      const today = new Date();
      const current = new Date(start);
      current.setDate(current.getDate() + 1);
      while (current <= today) {
        const dateStr = current.toISOString().split("T")[0];
        if (dateStr) {
          addEvent(dateStr, { type: "rest-day", isCurrentRest: true });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return map;
  }, [sessions, cycles, restHistory, currentRest]);

  // Get days in month
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before first of month
    const startDayOfWeek = firstDay.getDay();
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < adjustedStart; i++) {
      days.push(null);
    }

    // Add days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.toISOString().split("T")[0] || null);
  };

  const monthName = currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekDays = [
    t("calendar.weekDays.mon"),
    t("calendar.weekDays.tue"),
    t("calendar.weekDays.wed"),
    t("calendar.weekDays.thu"),
    t("calendar.weekDays.fri"),
    t("calendar.weekDays.sat"),
    t("calendar.weekDays.sun"),
  ];

  const selectedDayEvents = selectedDay ? eventsByDate.get(selectedDay) || [] : [];

  const getEventColor = (type: EventType) => {
    switch (type) {
      case "session":
        return "bg-red-500";
      case "cycle-start":
        return "bg-green-500";
      case "cycle-end":
        return "bg-orange-500";
      case "rest-start":
      case "rest-end":
      case "rest-day":
        return "bg-blue-400";
      default:
        return "bg-gray-400";
    }
  };

  const renderEventBadge = (event: DayEvent) => {
    switch (event.type) {
      case "session":
        return "🏋️";
      case "cycle-start":
        return "🚀";
      case "cycle-end":
        return "🏁";
      case "rest-start":
      case "rest-end":
        return "😴";
      case "rest-day":
        return null; // Just background color
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
            {monthName}
          </h3>
          <button
            onClick={goToToday}
            className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {t("calendar.today")}
          </button>
        </div>
        <button
          onClick={goToNextMonth}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">{t("calendar.legend.session")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">{t("calendar.legend.cycleStart")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-gray-600 dark:text-gray-400">{t("calendar.legend.cycleEnd")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-blue-400" />
          <span className="text-gray-600 dark:text-gray-400">{t("calendar.legend.rest")}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {daysInMonth.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[60px] md:min-h-[80px]" />;
            }

            const dateStr = day.toISOString().split("T")[0] || "";
            const events = eventsByDate.get(dateStr) || [];
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const isSelected = dateStr === selectedDay;
            const hasRestDay = events.some((e) => e.type === "rest-day");

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`relative min-h-[60px] border-b border-r border-gray-100 p-1 text-left transition-colors hover:bg-gray-50 md:min-h-[80px] md:p-2 dark:border-gray-800 dark:hover:bg-gray-800 ${
                  isSelected ? "bg-red-50 dark:bg-red-950/30" : ""
                } ${hasRestDay ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-red-600 text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {day.getDate()}
                </span>

                {/* Event indicators */}
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {events
                    .filter((e) => e.type !== "rest-day")
                    .slice(0, 3)
                    .map((event, i) => (
                      <span
                        key={i}
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${getEventColor(event.type)}`}
                        title={event.type}
                      >
                        {renderEventBadge(event)}
                      </span>
                    ))}
                  {events.filter((e) => e.type !== "rest-day").length > 3 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-[8px] font-bold text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                      +{events.filter((e) => e.type !== "rest-day").length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
            {new Date(`${selectedDay  }T12:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h4>

          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("calendar.noEvents")}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-start justify-between rounded-lg p-3 ${
                    event.type === "session"
                      ? "bg-red-50 dark:bg-red-950/30"
                      : event.type === "cycle-start"
                        ? "bg-green-50 dark:bg-green-950/30"
                        : event.type === "cycle-end"
                          ? "bg-orange-50 dark:bg-orange-950/30"
                          : "bg-blue-50 dark:bg-blue-950/30"
                  }`}
                >
                  <div className="flex-1">
                    {event.type === "session" && event.session && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏋️</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {t("calendar.session")}
                          </span>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                            {event.session.phase === "bilbo" ? "Bilbo" : t("session.phases.strength")}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {formatWeight(event.session.loadUsedKg, unitsUI)} × {event.session.reps} reps
                          {event.session.notes && (
                            <span className="ml-2 italic">"{event.session.notes}"</span>
                          )}
                        </div>
                      </>
                    )}

                    {event.type === "cycle-start" && event.cycle && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🚀</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {t("exercise.timeline.cycleStarted", { number: event.cycle.index })}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          1RM: {formatWeight(event.cycle.base1RMKg, unitsUI)}
                        </div>
                      </>
                    )}

                    {event.type === "cycle-end" && event.cycle && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏁</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {t("exercise.timeline.cycleEnded", { number: event.cycle.index })}
                          </span>
                        </div>
                        {event.cycle.improved1RMKg && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {t("rm.new")}: {formatWeight(event.cycle.improved1RMKg, unitsUI)}
                          </div>
                        )}
                      </>
                    )}

                    {event.type === "rest-start" && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">😴</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {t("exercise.timeline.restStarted")}
                        </span>
                        {event.isCurrentRest && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {t("calendar.currentRest")}
                          </span>
                        )}
                      </div>
                    )}

                    {event.type === "rest-end" && event.rest && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {t("exercise.timeline.restEnded")}
                        </span>
                      </div>
                    )}

                    {event.type === "rest-day" && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💤</span>
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {t("calendar.restDay")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {event.type === "session" && event.session && (
                      <>
                        <button
                          onClick={() => onEditSession(event.session!)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title={t("common.edit")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteSession(event.session!.id)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/50"
                          title={t("common.delete")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}

                    {(event.type === "cycle-start" || event.type === "cycle-end") && event.cycle && (
                      <>
                        <button
                          onClick={() => onEditCycle(event.cycle!)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title={t("common.edit")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteCycle(event.cycle!.id)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/50"
                          title={t("common.delete")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}

                    {(event.type === "rest-start" || event.type === "rest-end") && event.rest && event.rest.id && !event.isCurrentRest && (
                      <>
                        <button
                          onClick={() => onEditRest(event.rest!)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title={t("common.edit")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteRest(event.rest!.id!)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/50"
                          title={t("common.delete")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

