"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { PauseIcon } from "./Icons";
import type { RecorderState } from "@/lib/useRecorder";

function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

interface RecordingOverlayProps {
  state: RecorderState;
  elapsedMs: number;
  showTimer: boolean;
  onClick?: () => void;
}

export const RecordingOverlay = memo(function RecordingOverlay({
  state,
  elapsedMs,
  showTimer,
  onClick,
}: RecordingOverlayProps) {
  const t = useTranslations();

  if (state !== "recording" && state !== "paused") {
    return null;
  }

  return (
    <div
      className="absolute left-4 top-4 z-10 flex items-center gap-2"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* REC/PAUSED badge */}
      {state === "recording" && (
        <div className="flex cursor-default items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white shadow-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          {t("overlay.rec")}
        </div>
      )}
      {state === "paused" && (
        <div className="flex cursor-default items-center gap-2 rounded-full bg-amber-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
          <PauseIcon />
          {t("overlay.paused")}
        </div>
      )}
      {/* Timer */}
      <div
        className={`cursor-default rounded-full bg-black/40 px-3 py-1 font-mono text-sm font-bold tabular-nums text-white shadow-lg backdrop-blur-sm transition-opacity ${
          showTimer ? "opacity-100" : "opacity-0"
        }`}
      >
        {formatElapsedTime(elapsedMs)}
      </div>
    </div>
  );
});

