"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { PauseIcon, InfoIcon, FullscreenEnterIcon, FullscreenExitIcon, MicOnIcon, MicOffIcon } from "./Icons";
import { RecordingInfoTooltip } from "./RecordingInfoTooltip";
import type { RecordingInfo } from "@/lib/useRecorder";

interface RecordingControlsOverlayProps {
  state: "recording" | "paused";
  showControls: boolean;
  // Recording actions
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  // Mic
  isMicEnabled: boolean;
  micPermissionDenied: boolean;
  onMicToggle: (enabled: boolean) => void;
  // Info
  recordingInfo: RecordingInfo | null;
  showInfoTooltip: boolean;
  onToggleInfoTooltip: () => void;
  // Fullscreen
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const RecordingControlsOverlay = memo(function RecordingControlsOverlay({
  state,
  showControls,
  onPause,
  onResume,
  onStop,
  isMicEnabled,
  micPermissionDenied,
  onMicToggle,
  recordingInfo,
  showInfoTooltip,
  onToggleInfoTooltip,
  isFullscreen,
  onToggleFullscreen,
}: RecordingControlsOverlayProps) {
  const t = useTranslations();

  return (
    <>
      {/* Fixed mic indicator - always visible when mic is ON, clickable to turn OFF */}
      {isMicEnabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMicToggle(false);
          }}
          className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-full bg-green-500/80 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:bg-green-600"
          title={t("mic.on")}
        >
          <MicOnIcon />
          <span className="font-medium">ON</span>
        </button>
      )}

      {/* Top right controls - info + fullscreen */}
      <div className={`absolute top-4 right-4 z-10 flex items-center gap-2 transition-opacity ${
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        {/* Info button with tooltip */}
        {recordingInfo && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleInfoTooltip(); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              title={t("overlay.info")}
            >
              <InfoIcon />
            </button>
            {showInfoTooltip && (
              <RecordingInfoTooltip info={recordingInfo} isMicEnabled={isMicEnabled} />
            )}
          </div>
        )}

        {/* Fullscreen */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          title={isFullscreen ? t("controls.exitFullscreen") : t("controls.fullscreen")}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
        </button>
      </div>

      {/* Mic toggle - only when OFF (ON is shown as fixed indicator) */}
      {!isMicEnabled && !micPermissionDenied && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMicToggle(true);
          }}
          className={`absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          title={t("mic.off")}
        >
          <MicOffIcon />
          <span className="text-xs font-medium">OFF</span>
        </button>
      )}

      {/* Bottom left controls - pause/resume + stop */}
      <div className={`absolute bottom-4 left-4 z-10 flex items-center gap-2 transition-opacity ${
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        {state === "recording" ? (
          <OverlayButton onClick={onPause} title={t("controls.pause")}>
            <PauseIcon />
          </OverlayButton>
        ) : (
          <OverlayButton onClick={onResume} title={t("controls.resume")}>
            <div className="h-3.5 w-3.5 rounded-full bg-red-500" />
          </OverlayButton>
        )}

        {/* Stop button - shared between recording and paused */}
        <OverlayButton onClick={onStop} title={t("controls.stop")}>
          <div className="h-3.5 w-3.5 rounded-sm bg-white" />
        </OverlayButton>
      </div>
    </>
  );
});

// Reusable overlay button
const OverlayButton = memo(function OverlayButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
      title={title}
    >
      {children}
    </button>
  );
});


