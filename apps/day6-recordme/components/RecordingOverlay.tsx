"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
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
  isMicEnabled: boolean;
  onClick?: () => void;
}

export const RecordingOverlay = memo(function RecordingOverlay({
  state,
  elapsedMs,
  showTimer,
  isMicEnabled,
  onClick,
}: RecordingOverlayProps) {
  const t = useTranslations();

  if (state !== "recording" && state !== "paused") {
    return null;
  }

  return (
    <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
      {/* REC/PAUSED badge - clickable */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className="cursor-pointer"
      >
        {state === "recording" && (
          <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {t("overlay.rec")}
          </div>
        )}
        {state === "paused" && (
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            {t("overlay.paused")}
          </div>
        )}
      </button>
      {/* Mic indicator - always visible when mic is ON */}
      {isMicEnabled && (
        <div className="flex cursor-default items-center gap-1 rounded-full bg-green-500/80 px-2 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>
      )}
      {/* Timer - not clickable */}
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

