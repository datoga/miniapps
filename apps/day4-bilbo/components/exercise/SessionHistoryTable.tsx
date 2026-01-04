"use client";

import type { Cycle, Session, UnitsUI } from "@/lib/schemas";
import { useTranslations } from "next-intl";
import { CycleEndRow, CycleStartRow } from "./TimelineEventRows";
import { SessionRow } from "./SessionRow";

export type TimelineEvent =
  | { type: "session"; session: Session }
  | { type: "cycle-start"; cycle: Cycle; timestamp: number }
  | { type: "cycle-end"; cycle: Cycle; timestamp: number };

interface SessionHistoryTableProps {
  timeline: TimelineEvent[];
  cycles: Cycle[];
  selectedCycleId: string | "all";
  unitsUI: UnitsUI;
  onCycleFilterChange: (cycleId: string | "all") => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteCycle: (cycleId: string) => void;
}

export function SessionHistoryTable({
  timeline,
  cycles,
  selectedCycleId,
  unitsUI,
  onCycleFilterChange,
  onEditSession,
  onDeleteSession,
  onDeleteCycle,
}: SessionHistoryTableProps) {
  const t = useTranslations();
  const hasNoSessions = timeline.filter((e) => e.type === "session").length === 0;

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            {t("exercise.filters.cycle")}
          </label>
          <select
            value={selectedCycleId}
            onChange={(e) => onCycleFilterChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">{t("exercise.filters.all")}</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {t("home.cycle")} {c.index}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      {hasNoSessions ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">{t("exercise.noSessions")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t("exercise.table.date")}
                </th>
                <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("exercise.table.load")}
                </th>
                <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("exercise.table.reps")}
                </th>
                <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("exercise.table.work")}
                </th>
                <th className="px-2 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                  {t("exercise.table.phase")}
                </th>
                <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {timeline.map((event) => {
                if (event.type === "session") {
                  return (
                    <SessionRow
                      key={event.session.id}
                      session={event.session}
                      unitsUI={unitsUI}
                      onEdit={() => onEditSession(event.session)}
                      onDelete={() => onDeleteSession(event.session.id)}
                    />
                  );
                }
                if (event.type === "cycle-start") {
                  return (
                    <CycleStartRow
                      key={`cycle-start-${event.cycle.id}`}
                      cycle={event.cycle}
                      timestamp={event.timestamp}
                      unitsUI={unitsUI}
                      onDelete={() => onDeleteCycle(event.cycle.id)}
                    />
                  );
                }
                if (event.type === "cycle-end") {
                  return (
                    <CycleEndRow
                      key={`cycle-end-${event.cycle.id}`}
                      cycle={event.cycle}
                      timestamp={event.timestamp}
                      unitsUI={unitsUI}
                      onDelete={() => onDeleteCycle(event.cycle.id)}
                    />
                  );
                }
                return null;
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
