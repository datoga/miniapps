"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, useRef } from "react";
import { Footer } from "@miniapps/ui";
import { AppHeader } from "./AppHeader";
import { UnsupportedScreen } from "./UnsupportedScreen";
import { SettingsSheet } from "./SettingsSheet";
import { VideoPreview } from "./VideoPreview";
import { CountdownOverlay } from "./CountdownOverlay";
import { ProcessingOverlay } from "./ProcessingOverlay";
import { RecordingOverlay } from "./RecordingOverlay";
import { FinishedView } from "./FinishedView";
import { checkBrowserSupport } from "@/lib/capabilities";
import { useMediaStream } from "@/lib/useMediaStream";
import { useRecorder } from "@/lib/useRecorder";
import {
  loadSettings,
  saveSettings,
  type RecorderSettings,
} from "@/lib/settings";

export function RecorderApp() {
  const t = useTranslations();

  // Browser support check
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<RecorderSettings>(() => loadSettings());
  const [formatWarningDismissed, setFormatWarningDismissed] = useState(false);

  // Custom filename
  const [customFilename, setCustomFilename] = useState("");

  // Video container ref
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Controls visibility (show on hover/click)
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const hideControlsNow = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
    setShowControls(false);
    setShowInfoTooltip(false);
  }, []);

  // Handle click on video - always show/extend controls visibility
  // On mobile, users need to tap to show controls, then tap buttons
  // So we should NOT toggle (hide on second tap) - just extend visibility
  const handleVideoClick = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) {return;}

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or failed
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Check browser support on mount
  useEffect(() => {
    const { supported } = checkBrowserSupport();
    setIsSupported(supported);
  }, []);

  // Media stream hook
  const mediaStream = useMediaStream({
    micDefaultOn: settings.micDefaultOn,
    cameraDefault: settings.cameraDefault,
  });

  // Recorder hook
  const recorder = useRecorder({
    settings,
    stream: mediaStream.stream,
    isMicEnabled: mediaStream.isMicEnabled,
    customFilename: customFilename.trim() || undefined,
  });

  // Reset custom filename and close tooltip after recording
  useEffect(() => {
    if (recorder.state === "finished") {
      setCustomFilename("");
      setShowInfoTooltip(false);
    }
  }, [recorder.state]);

  // Sync mic state when setting changes (only in idle state)
  useEffect(() => {
    if (recorder.state === "idle" && mediaStream.stream) {
      mediaStream.setMicEnabled(settings.micDefaultOn);
    }
  }, [settings.micDefaultOn, recorder.state, mediaStream.stream, mediaStream.setMicEnabled]);

  // Save settings when changed
  const handleSettingsChange = useCallback((newSettings: RecorderSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // Handle home click - only reset if finished
  const handleHomeClick = useCallback(() => {
    if (recorder.state === "finished") {
      recorder.resetRecorder();
    }
    // Otherwise do nothing (idle, recording, paused, processing, countdown)
  }, [recorder.state, recorder.resetRecorder]);

  // Determine if settings should be disabled
  const settingsDisabled =
    recorder.state === "countdown" ||
    recorder.state === "recording" ||
    recorder.state === "paused" ||
    recorder.state === "processing";

  // Show format warning
  const showFormatWarning = recorder.formatWarning && !formatWarningDismissed;

  // Loading state
  if (isSupported === null) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <AppHeader
          onSettingsClick={() => {}}
          settingsDisabled
          onHomeClick={handleHomeClick}
        />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Unsupported browser
  if (!isSupported) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <AppHeader
          onSettingsClick={() => {}}
          settingsDisabled
          onHomeClick={handleHomeClick}
        />
        <main className="flex-1">
          <UnsupportedScreen />
        </main>
        <Footer />
      </div>
    );
  }

  // Finished state - show result
  if (recorder.state === "finished" && recorder.result && recorder.resultUrl) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <AppHeader
          onSettingsClick={() => setSettingsOpen(true)}
          settingsDisabled={false}
          onHomeClick={handleHomeClick}
        />
        <main className="flex-1">
          <div className="mx-auto max-w-3xl px-4 py-6">
            <FinishedView
              result={recorder.result}
              resultUrl={recorder.resultUrl}
              resultFile={recorder.resultFile}
              onRecordAgain={recorder.resetRecorder}
            />
          </div>
        </main>
        <Footer />
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          disabled={false}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <AppHeader
        onSettingsClick={() => setSettingsOpen(true)}
        settingsDisabled={settingsDisabled}
        onHomeClick={handleHomeClick}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* Format warning banner */}
          {showFormatWarning && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <span>⚠️ {t("settings.format.mp4Warning")}</span>
              <button
                onClick={() => setFormatWarningDismissed(true)}
                className="ml-2 rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Permission denied state */}
          {mediaStream.cameraPermission === "denied" && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950/30">
              <div className="mb-2 text-4xl">📷</div>
              <h3 className="mb-2 font-semibold text-red-800 dark:text-red-300">
                {t("recorder.permissions.denied")}
              </h3>
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                {t("recorder.permissions.deniedDescription")}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t("recorder.permissions.retry")}
              </button>
            </div>
          )}

          {/* Mic denied warning */}
          {mediaStream.micPermission === "denied" && mediaStream.cameraPermission === "granted" && (
            <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              ⚠️ {t("recorder.permissions.micDenied")}
            </div>
          )}

          {/* Video Preview Area */}
          {mediaStream.cameraPermission !== "denied" && (
            <>
              {/* Video Container - always full width for consistent size */}
              <div
                ref={videoContainerRef}
                onMouseEnter={showControlsTemporarily}
                onMouseMove={showControlsTemporarily}
                onMouseLeave={hideControlsNow}
                onClick={handleVideoClick}
                className={`relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ${
                  recorder.state === "recording" || recorder.state === "paused" ? "cursor-pointer" : ""
                }`}
              >
                  {/* Loading state */}
                  {mediaStream.isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white mx-auto" />
                        <p className="text-sm text-white/80">
                          {t("recorder.permissions.requesting")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Video preview */}
                  {mediaStream.stream && (
                    <VideoPreview stream={mediaStream.stream} />
                  )}

                  {/* Recording overlay (REC badge + timer) - click to show controls */}
                  <RecordingOverlay
                    state={recorder.state}
                    elapsedMs={recorder.elapsedMs}
                    showTimer={showControls}
                    onClick={handleVideoClick}
                  />

                  {/* Fixed mic indicator - always visible when mic is ON during recording, clickable to turn OFF */}
                  {(recorder.state === "recording" || recorder.state === "paused") && mediaStream.isMicEnabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        mediaStream.setMicEnabled(false);
                      }}
                      className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-full bg-green-500/80 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:bg-green-600"
                      title={t("mic.on")}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                      <span className="font-medium">ON</span>
                    </button>
                  )}

                  {/* Top right controls during recording - info + fullscreen */}
                  {(recorder.state === "recording" || recorder.state === "paused") && (
                    <div className={`absolute top-4 right-4 z-10 flex items-center gap-2 transition-opacity ${
                      showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}>
                      {/* Info button with tooltip */}
                      {recorder.recordingInfo && (
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowInfoTooltip(!showInfoTooltip); }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                            title={t("overlay.info")}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          {/* Info Tooltip */}
                          {showInfoTooltip && (
                            <div
                              className="absolute right-0 top-10 min-w-64 max-w-md whitespace-nowrap rounded-xl bg-black/90 p-4 text-xs text-white shadow-xl backdrop-blur-md"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="shrink-0 text-white/60">{t("overlay.infoFolder")}</span>
                                  <span className="font-mono text-white/90">{recorder.recordingInfo.folderName}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="shrink-0 text-white/60">{t("overlay.infoFilename")}</span>
                                  <span className="font-mono text-white/90">{recorder.recordingInfo.filename}</span>
                                </div>
                                <div className="flex items-baseline gap-2 border-t border-white/20 pt-2">
                                  <span className="shrink-0 text-white/60">{t("overlay.infoFormat")}</span>
                                  <span className="font-mono text-white/90">{recorder.recordingInfo.mimeType}</span>
                                </div>
                                <div className="flex items-baseline gap-4">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-white/60">{t("overlay.infoResolution")}</span>
                                    <span className="font-mono text-white/90">{recorder.recordingInfo.width}×{recorder.recordingInfo.height}</span>
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-white/60">{t("overlay.infoFps")}</span>
                                    <span className="font-mono text-white/90">{recorder.recordingInfo.fps}</span>
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-white/60">{t("overlay.infoBitrate")}</span>
                                    <span className="font-mono text-white/90">{recorder.recordingInfo.bitrateMbps} Mbps</span>
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="shrink-0 text-white/60">{t("overlay.infoAudio")}</span>
                                  <span className="font-mono text-white/90">
                                    {mediaStream.isMicEnabled ? "✓ ON" : "✗ OFF"}
                                    {mediaStream.isMicEnabled && recorder.recordingInfo.audioCodec && (
                                      <span className="ml-2 text-white/60">
                                        {recorder.recordingInfo.audioCodec.toUpperCase()}
                                        {recorder.recordingInfo.audioSampleRate && ` · ${Math.round(recorder.recordingInfo.audioSampleRate / 1000)}kHz`}
                                        {recorder.recordingInfo.audioChannels && ` · ${recorder.recordingInfo.audioChannels}ch`}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Fullscreen */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                        title={isFullscreen ? t("controls.exitFullscreen") : t("controls.fullscreen")}
                      >
                        {isFullscreen ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Mic toggle overlay - only during recording/paused and ONLY when mic is OFF */}
                  {mediaStream.stream && mediaStream.micPermission !== "denied" && recorder.state !== "idle" && !mediaStream.isMicEnabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        mediaStream.setMicEnabled(true);
                      }}
                      className={`absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                      title={t("mic.off")}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.18 4.18 1.27-1.27L4.27 3z" />
                      </svg>
                      <span className="text-xs font-medium">OFF</span>
                    </button>
                  )}


                {/* Recording controls overlay - bottom left, compact style */}
                {(recorder.state === "recording" || recorder.state === "paused") && (
                  <div className={`absolute bottom-4 left-4 z-10 flex items-center gap-2 transition-opacity ${
                    showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}>
                    {recorder.state === "recording" ? (
                      <>
                        {/* Pause */}
                        <button
                          onClick={(e) => { e.stopPropagation(); recorder.pauseRecording(); }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
                          title={t("controls.pause")}
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        </button>

                        {/* Stop */}
                        <button
                          onClick={(e) => { e.stopPropagation(); recorder.stopRecording(); }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
                          title={t("controls.stop")}
                        >
                          <div className="h-3.5 w-3.5 rounded-sm bg-white" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Resume */}
                        <button
                          onClick={(e) => { e.stopPropagation(); recorder.resumeRecording(); }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
                          title={t("controls.resume")}
                        >
                          <div className="h-3.5 w-3.5 rounded-full bg-red-500" />
                        </button>

                        {/* Stop */}
                        <button
                          onClick={(e) => { e.stopPropagation(); recorder.stopRecording(); }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
                          title={t("controls.stop")}
                        >
                          <div className="h-3.5 w-3.5 rounded-sm bg-white" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Countdown overlay */}
                {recorder.state === "countdown" && recorder.countdownValue > 0 && (
                  <CountdownOverlay value={recorder.countdownValue} />
                )}

                {/* Processing overlay */}
                {recorder.state === "processing" && <ProcessingOverlay />}
              </div>

              {/* Recording controls - simple row below video */}
              {!mediaStream.isLoading && mediaStream.stream && recorder.state === "idle" && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  {/* Mic toggle */}
                  {mediaStream.micPermission !== "denied" && (
                    <button
                      onClick={() => mediaStream.setMicEnabled(!mediaStream.isMicEnabled)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                        mediaStream.isMicEnabled
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                      }`}
                      title={mediaStream.isMicEnabled ? t("mic.on") : t("mic.off")}
                    >
                      {mediaStream.isMicEnabled ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.18 4.18 1.27-1.27L4.27 3z" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Record Button */}
                  <button
                    onClick={recorder.startRecording}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:bg-red-500 hover:scale-105 active:scale-95"
                    title={t("controls.record")}
                  >
                    <div className="h-6 w-6 rounded-full bg-white" />
                  </button>

                  {/* Filename toggle */}
                  {customFilename ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customFilename}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\.(mp4|webm|mkv|avi|mov|m4v)$/gi, "");
                          setCustomFilename(value);
                        }}
                        onBlur={() => {
                          if (!customFilename.trim()) {setCustomFilename("");}
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder={t("filename.default")}
                        className="w-40 rounded-lg bg-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-200"
                        autoFocus
                      />
                      <button
                        onClick={() => setCustomFilename("")}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                        title="Auto"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCustomFilename(t("filename.default"))}
                      className="flex items-center gap-2 rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      title="Custom name"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      auto
                    </button>
                  )}
                </div>
              )}

              {/* Camera selector - only show in idle state if multiple cameras */}
              {!mediaStream.isLoading && mediaStream.stream && recorder.state === "idle" && mediaStream.videoDevices.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <select
                    value={mediaStream.selectedVideoDeviceId || ""}
                    onChange={(e) => mediaStream.switchCamera(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {mediaStream.videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Error display - don't show if camera permission is denied (has dedicated UI) */}
          {(mediaStream.error || recorder.error) && mediaStream.cameraPermission !== "denied" && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              ⚠️ {(() => {
                const error = mediaStream.error || recorder.error;
                // Check if error is a translation key
                if (error?.startsWith("errors.")) {
                  return t(error);
                }
                return error;
              })()}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        disabled={settingsDisabled}
      />
    </div>
  );
}

