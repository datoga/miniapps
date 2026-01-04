"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Session, Cycle, UnitsUI } from "@/lib/schemas";
import { fromKg, format2, estimate1RM } from "@/lib/math";
import {
  ChartGradients,
  CustomTooltip,
  CycleSelector,
  SeriesToggle,
  SessionDetailModal,
  FullscreenChartModal,
  getCycleColor,
  type SessionDataPoint,
  type ShowSeries,
  type ShowSeriesWork,
  type ChartType,
} from "./chart";

interface ExerciseChartProps {
  sessions: Session[];
  cycles: Cycle[];
  unitsUI: UnitsUI;
}

export function ExerciseChart({ sessions, cycles, unitsUI }: ExerciseChartProps) {
  const t = useTranslations();

  // Default: show only the last cycle (highest index)
  const lastCycle = cycles.length > 0 ? cycles.reduce((a, b) => (a.index > b.index ? a : b)) : null;
  const [selectedCycleIds, setSelectedCycleIds] = useState<string[]>(
    lastCycle ? [lastCycle.id] : []
  );
  const [selectedSession, setSelectedSession] = useState<SessionDataPoint | null>(null);
  const [fullscreenChart, setFullscreenChart] = useState<ChartType | null>(null);
  const [showSeries, setShowSeries] = useState<ShowSeries>("both");
  const [showSeriesWork, setShowSeriesWork] = useState<ShowSeriesWork>("both");

  // Group sessions by cycle and transform data
  const cycleData = useMemo(() => {
    const result: Record<string, SessionDataPoint[]> = {};

    for (const cycle of cycles) {
      const cycleSessions = sessions
        .filter((s) => s.cycleId === cycle.id)
        .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

      result[cycle.id] = cycleSessions.map((session, index) => {
        const date = new Date(session.datetime);
        const estimated = estimate1RM(session.loadUsedKg, session.reps);
        return {
          sessionNumber: index + 1,
          cycleId: cycle.id,
          cycleIndex: cycle.index,
          date: date.toLocaleDateString(),
          datetime: session.datetime,
          loadUsed: parseFloat(format2(fromKg(session.loadUsedKg, unitsUI))),
          reps: session.reps,
          work: parseFloat(format2(fromKg(session.workKg, unitsUI))),
          estimated1RM: parseFloat(format2(fromKg(estimated, unitsUI))),
          phase: session.phase,
          notes: session.notes,
          timeSeconds: session.timeSeconds,
        };
      });
    }

    return result;
  }, [sessions, cycles, unitsUI]);

  // Build chart data with session number as X axis
  const buildChartData = (metricKey: "loadUsed" | "work") => {
    let maxSessions = 0;
    for (const cycleId of selectedCycleIds) {
      const data = cycleData[cycleId];
      if (data && data.length > maxSessions) {
        maxSessions = data.length;
      }
    }

    const chartData: Record<string, unknown>[] = [];
    for (let i = 1; i <= maxSessions; i++) {
      const point: Record<string, unknown> = { sessionNumber: i };

      for (const cycleId of selectedCycleIds) {
        const data = cycleData[cycleId];
        const session = data?.find((s) => s.sessionNumber === i);
        if (session) {
          const cycle = cycles.find((c) => c.id === cycleId);
          const key = `cycle_${cycle?.index || 0}`;
          point[key] = session[metricKey];
          point[`${key}_reps`] = session.reps;
          point[`${key}_data`] = session;
        }
      }

      chartData.push(point);
    }

    return chartData;
  };

  const toggleCycle = (cycleId: string) => {
    setSelectedCycleIds((prev) =>
      prev.includes(cycleId) ? prev.filter((id) => id !== cycleId) : [...prev, cycleId]
    );
  };

  const selectAllCycles = () => {
    setSelectedCycleIds(cycles.map((c) => c.id));
  };

  const selectOnlyLastCycle = () => {
    if (lastCycle) {
      setSelectedCycleIds([lastCycle.id]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      for (const key of Object.keys(payload)) {
        if (key.endsWith("_data") && payload[key]) {
          setSelectedSession(payload[key] as SessionDataPoint);
          break;
        }
      }
    }
  };

  // Get selected cycles sorted by index
  const selectedCycles = cycles
    .filter((c) => selectedCycleIds.includes(c.id))
    .sort((a, b) => b.index - a.index);

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">{t("charts.noData")}</p>
      </div>
    );
  }

  const loadRepsRmData = buildChartData("loadUsed");
  const workData = buildChartData("work");

  const loadSeriesOptions = [
    { key: "both", labelKey: "charts.both" },
    { key: "load", labelKey: "charts.loadOnly" },
    { key: "reps", labelKey: "charts.repsOnly" },
  ];

  const workSeriesOptions = [
    { key: "both", labelKey: "charts.both" },
    { key: "work", labelKey: "charts.workOnly" },
    { key: "reps", labelKey: "charts.repsOnly" },
  ];

  return (
    <div className="space-y-6">
      {/* Cycle selector */}
      <CycleSelector
        cycles={cycles}
        selectedCycleIds={selectedCycleIds}
        lastCycleId={lastCycle?.id}
        onToggle={toggleCycle}
        onSelectAll={selectAllCycles}
        onSelectOnlyLast={selectOnlyLastCycle}
      />

      {/* Chart 1: Weight & Reps */}
      <ChartCard
        title={
          showSeries === "both"
            ? `${t("charts.loadUsed")} / ${t("charts.reps")}`
            : showSeries === "load"
              ? t("charts.loadUsed")
              : t("charts.reps")
        }
        subtitle={t("charts.sessionNumber")}
        seriesToggle={
          <SeriesToggle
            value={showSeries}
            options={loadSeriesOptions}
            onChange={(v) => setShowSeries(v as ShowSeries)}
          />
        }
        onFullscreen={() => setFullscreenChart("load")}
        fullscreenLabel={t("charts.fullscreen")}
      >
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={loadRepsRmData}
              margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
              onClick={handleChartClick}
            >
              <ChartGradients />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                opacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="sessionNumber"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#d1d5db", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <CustomTooltip
                    active={active}
                    payload={payload as never}
                    label={label}
                    unitsUI={unitsUI}
                    t={t}
                  />
                )}
              />
              <Legend
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => (
                  <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
                )}
              />

              {(showSeries === "both" || showSeries === "load") &&
                selectedCycles.map((cycle, idx) => {
                  const color = getCycleColor(idx);
                  return (
                    <Area
                      key={`load_${cycle.id}`}
                      yAxisId="left"
                      type="monotone"
                      dataKey={`cycle_${cycle.index}`}
                      stroke={color.main}
                      strokeWidth={2.5}
                      fill={color.gradient}
                      dot={{ fill: color.main, strokeWidth: 0, r: 4, cursor: "pointer" }}
                      activeDot={{
                        r: 7,
                        fill: color.main,
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }}
                      name={`${t("charts.loadUsed")} C${cycle.index}`}
                      connectNulls
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  );
                })}

              {(showSeries === "both" || showSeries === "reps") &&
                selectedCycles.map((cycle, idx) => {
                  const color = getCycleColor(idx);
                  return (
                    <Line
                      key={`reps_${cycle.id}`}
                      yAxisId="right"
                      type="monotone"
                      dataKey={`cycle_${cycle.index}_reps`}
                      stroke={color.reps}
                      strokeWidth={2.5}
                      strokeDasharray={showSeries === "both" ? "8 4" : undefined}
                      dot={{ fill: color.reps, strokeWidth: 0, r: 5, cursor: "pointer" }}
                      activeDot={{
                        r: 7,
                        fill: color.reps,
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }}
                      name={`${t("charts.reps")} C${cycle.index}`}
                      connectNulls
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  );
                })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Chart 2: Work & Reps */}
      <ChartCard
        title={
          showSeriesWork === "both"
            ? `${t("charts.work")} / ${t("charts.reps")}`
            : showSeriesWork === "work"
              ? t("charts.work")
              : t("charts.reps")
        }
        subtitle={t("charts.volume")}
        seriesToggle={
          <SeriesToggle
            value={showSeriesWork}
            options={workSeriesOptions}
            onChange={(v) => setShowSeriesWork(v as ShowSeriesWork)}
          />
        }
        onFullscreen={() => setFullscreenChart("work")}
        fullscreenLabel={t("charts.fullscreen")}
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={workData}
              margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
              onClick={handleChartClick}
            >
              <ChartGradients />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                opacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="sessionNumber"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#d1d5db", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <CustomTooltip
                    active={active}
                    payload={payload as never}
                    label={label}
                    unitsUI={unitsUI}
                    t={t}
                  />
                )}
              />
              <Legend
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => (
                  <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
                )}
              />

              {(showSeriesWork === "both" || showSeriesWork === "work") &&
                selectedCycles.map((cycle, idx) => {
                  const color = getCycleColor(idx);
                  return (
                    <Area
                      key={`work_${cycle.id}`}
                      yAxisId="left"
                      type="monotone"
                      dataKey={`cycle_${cycle.index}`}
                      stroke={color.main}
                      strokeWidth={2.5}
                      fill={color.gradient}
                      dot={{ fill: color.main, strokeWidth: 0, r: 4, cursor: "pointer" }}
                      activeDot={{
                        r: 7,
                        fill: color.main,
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }}
                      name={`${t("charts.work")} C${cycle.index}`}
                      connectNulls
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  );
                })}

              {(showSeriesWork === "both" || showSeriesWork === "reps") &&
                selectedCycles.map((cycle, idx) => {
                  const color = getCycleColor(idx);
                  return (
                    <Line
                      key={`reps_work_${cycle.id}`}
                      yAxisId="right"
                      type="monotone"
                      dataKey={`cycle_${cycle.index}_reps`}
                      stroke={color.reps}
                      strokeWidth={2.5}
                      strokeDasharray={showSeriesWork === "both" ? "8 4" : undefined}
                      dot={{ fill: color.reps, strokeWidth: 0, r: 5, cursor: "pointer" }}
                      activeDot={{
                        r: 7,
                        fill: color.reps,
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }}
                      name={`${t("charts.reps")} C${cycle.index}`}
                      connectNulls
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  );
                })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          unitsUI={unitsUI}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Fullscreen Chart Modal */}
      {fullscreenChart && (
        <FullscreenChartModal
          type={fullscreenChart}
          loadRepsRmData={loadRepsRmData}
          workData={workData}
          selectedCycles={selectedCycles}
          unitsUI={unitsUI}
          onChartClick={handleChartClick}
          onClose={() => setFullscreenChart(null)}
          showSeries={fullscreenChart === "load" ? showSeries : showSeriesWork}
          setShowSeries={(value) => {
            if (fullscreenChart === "load") {
              if (value === "both" || value === "load" || value === "reps") {
                setShowSeries(value);
              }
            } else {
              if (value === "both" || value === "work" || value === "reps") {
                setShowSeriesWork(value);
              }
            }
          }}
        />
      )}
    </div>
  );
}

// Simple wrapper for chart cards
interface ChartCardProps {
  title: string;
  subtitle: string;
  seriesToggle: React.ReactNode;
  onFullscreen: () => void;
  fullscreenLabel: string;
  children: React.ReactNode;
}

function ChartCard({
  title,
  subtitle,
  seriesToggle,
  onFullscreen,
  fullscreenLabel,
  children,
}: ChartCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {seriesToggle}
          <button
            onClick={onFullscreen}
            className="rounded-xl bg-gray-100 p-2.5 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title={fullscreenLabel}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
