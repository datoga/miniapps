"use client";

import type { Cycle, UnitsUI } from "@/lib/schemas";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartGradients } from "./ChartGradients";
import { CustomTooltip } from "./CustomTooltip";
import { getCycleColor } from "./colors";
import type { ChartType } from "./types";

interface FullscreenChartModalProps {
  type: ChartType;
  loadRepsRmData: Record<string, unknown>[];
  workData: Record<string, unknown>[];
  selectedCycles: Cycle[];
  unitsUI: UnitsUI;
  onChartClick: (data: unknown) => void;
  onClose: () => void;
  showSeries: "both" | "load" | "work" | "reps";
  setShowSeries: (value: "both" | "load" | "work" | "reps") => void;
}

export function FullscreenChartModal({
  type,
  loadRepsRmData,
  workData,
  selectedCycles,
  unitsUI,
  onChartClick,
  onClose,
  showSeries,
  setShowSeries,
}: FullscreenChartModalProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);

  // Exit fullscreen and close
  const handleClose = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  // Enter browser fullscreen on mount
  useEffect(() => {
    const container = containerRef.current;
    if (container && document.fullscreenEnabled) {
      container.requestFullscreen().catch(() => {
        // Fullscreen not supported or blocked, modal still works
      });
    }

    // Handle fullscreen change (user presses ESC in fullscreen mode)
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onClose]);

  // Close on ESC key (fallback for non-fullscreen mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const data = type === "load" ? loadRepsRmData : workData;

  const getTitle = () => {
    if (type === "work") {
      if (showSeries === "both") {
        return `${t("charts.work")} / ${t("charts.reps")}`;
      }
      return showSeries === "work" ? t("charts.work") : t("charts.reps");
    }
    if (showSeries === "both") {
      return `${t("charts.loadUsed")} / ${t("charts.reps")}`;
    }
    return showSeries === "load" ? t("charts.loadUsed") : t("charts.reps");
  };

  const mainSeriesKey = type === "load" ? "load" : "work";
  const mainSeriesLabel = type === "load" ? t("charts.loadOnly") : t("charts.workOnly");

  const renderChart = (chartData: Record<string, unknown>[]) => (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
        onClick={onChartClick}
      >
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} vertical={false} />
        <XAxis
          dataKey="sessionNumber"
          tick={{ fill: "#9ca3af", fontSize: 13 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          label={{
            value: t("charts.sessionNumber"),
            position: "insideBottom",
            offset: -10,
            fill: "#9ca3af",
            fontSize: 13,
          }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "#9ca3af", fontSize: 13 }}
          tickLine={false}
          axisLine={false}
          width={type === "work" ? 60 : 50}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#d1d5db", fontSize: 13 }}
          tickLine={false}
          axisLine={false}
          domain={[0, "auto"]}
          width={50}
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
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => (
            <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
          )}
        />

        {/* Main metric areas (filled, left axis) */}
        {(showSeries === "both" || showSeries === mainSeriesKey) &&
          selectedCycles.map((cycle, idx) => {
            const color = getCycleColor(idx);
            return (
              <Area
                key={`main_${cycle.id}`}
                yAxisId="left"
                type="monotone"
                dataKey={`cycle_${cycle.index}`}
                stroke={color.main}
                strokeWidth={3}
                fill={color.gradient}
                dot={{ fill: color.main, strokeWidth: 0, r: 6, cursor: "pointer" }}
                activeDot={{
                  r: 10,
                  fill: color.main,
                  stroke: "#fff",
                  strokeWidth: 3,
                  cursor: "pointer",
                }}
                name={`${type === "work" ? t("charts.work") : t("charts.loadUsed")} C${cycle.index}`}
                connectNulls
                animationDuration={800}
                animationEasing="ease-out"
              />
            );
          })}

        {/* Reps lines (dashed, right axis) */}
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
                strokeWidth={3}
                strokeDasharray={showSeries === "both" ? "8 4" : undefined}
                dot={{ fill: color.reps, strokeWidth: 0, r: 6, cursor: "pointer" }}
                activeDot={{
                  r: 9,
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
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-white to-gray-100 pt-[env(safe-area-inset-top,0px)] dark:from-gray-950 dark:to-gray-900"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{getTitle()}</h2>
        <div className="flex items-center gap-4">
          {/* Series toggle */}
          <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
            <button
              onClick={() => setShowSeries("both")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                showSeries === "both"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {t("charts.both")}
            </button>
            <button
              onClick={() => setShowSeries(mainSeriesKey)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                showSeries === mainSeriesKey
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {mainSeriesLabel}
            </button>
            <button
              onClick={() => setShowSeries("reps")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                showSeries === "reps"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {t("charts.repsOnly")}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl bg-gray-100 p-3 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto p-6">
        <div className="h-full">{renderChart(data)}</div>
      </div>
    </div>
  );
}
