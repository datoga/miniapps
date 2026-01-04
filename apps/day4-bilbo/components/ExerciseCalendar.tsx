"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Cycle, Session, UnitsUI } from "@/lib/schemas";
import { formatWeight } from "@/lib/math";

interface ExerciseCalendarProps {
  sessions: Session[];
  cycles: Cycle[];
  unitsUI: UnitsUI;
  onEditSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditCycle: (cycle: Cycle) => void;
  onDeleteCycle: (cycleId: string) => void;
}

type EventType = "session" | "cycle-start" | "cycle-end";

interface DayEvent {
  type: EventType;
  session?: Session;
  cycle?: Cycle;
}

export function ExerciseCalendar({
  sessions,
  cycles,
  unitsUI,
  onEditSession,
  onDeleteSession,
  onEditCycle,
  onDeleteCycle,
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

    return map;
  }, [sessions, cycles]);

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
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {weekDays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-12 md:h-16" />;
          }

          const dateStr = day.toISOString().split("T")[0] || "";
          const events = eventsByDate.get(dateStr) || [];
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          const isSelected = dateStr === selectedDay;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`relative flex h-12 flex-col items-center justify-start rounded-lg p-1 text-sm transition-colors md:h-16 md:p-2 ${
                isSelected
                  ? "bg-red-100 ring-2 ring-red-500 dark:bg-red-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              } ${isToday ? "font-bold" : ""}`}
            >
              <span
                className={`${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white" : "text-gray-700 dark:text-gray-300"}`}
              >
                {day.getDate()}
              </span>
              {events.length > 0 && (
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {events.slice(0, 3).map((event, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${getEventColor(event.type)}`}
                    />
                  ))}
                  {events.length > 3 && (
                    <span className="text-[8px] text-gray-500">+{events.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Events */}
      {selectedDay && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
            {new Date(selectedDay).toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h4>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("calendar.noEvents")}</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{renderEventBadge(event)}</span>
                    <div>
                      {event.type === "session" && event.session && (
                        <>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {t("calendar.session")}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatWeight(event.session.loadUsedKg, unitsUI)} × {event.session.reps}{" "}
                            reps
                          </p>
                        </>
                      )}
                      {event.type === "cycle-start" && event.cycle && (
                        <>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            {t("calendar.legend.cycleStart")}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("home.cycle")} {event.cycle.index}
                          </p>
                        </>
                      )}
                      {event.type === "cycle-end" && event.cycle && (
                        <>
                          <p className="font-medium text-orange-700 dark:text-orange-400">
                            {t("calendar.legend.cycleEnd")}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("home.cycle")} {event.cycle.index}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.type === "session" && event.session && (
                      <>
                        <button
                          onClick={() => onEditSession(event.session!)}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title={t("common.edit")}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteSession(event.session!.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title={t("common.delete")}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                    {(event.type === "cycle-start" || event.type === "cycle-end") && event.cycle && (
                      <>
                        <button
                          onClick={() => onEditCycle(event.cycle!)}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title={t("common.edit")}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteCycle(event.cycle!.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title={t("common.delete")}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
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
