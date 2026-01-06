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
import { RecordingControlsOverlay } from "./RecordingControlsOverlay";
import { IdleControls } from "./IdleControls";
import { FinishedView } from "./FinishedView";
import { CloseIcon } from "./Icons";
import { checkBrowserSupport } from "@/lib/capabilities";
import { useMediaStream } from "@/lib/useMediaStream";
import { useRecorder } from "@/lib/useRecorder";
import { useControlsVisibility } from "@/lib/useControlsVisibility";
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customFilename, setCustomFilename] = useState("");

  // Video container for fullscreen
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Controls visibility hook
  const controlsVisibility = useControlsVisibility();

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;
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
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

  // Show toast helper
  const showToast = useCallback((message: string, duration = 2500) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  }, []);

  // Recorder hook
  const recorder = useRecorder({
    settings,
    stream: mediaStream.stream,
    isMicEnabled: mediaStream.isMicEnabled,
    customFilename: customFilename.trim() || undefined,
    onFolderPrompt: () => showToast(t("recorder.folderPrompt"), 3000),
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
  }, [recorder.state, recorder.resetRecorder]);

  // Settings disabled during active recording states
  const settingsDisabled =
    recorder.state === "countdown" ||
    recorder.state === "recording" ||
    recorder.state === "paused" ||
    recorder.state === "processing";

  const showFormatWarning = recorder.formatWarning && !formatWarningDismissed;
  const isRecordingActive = recorder.state === "recording" || recorder.state === "paused";

  // Loading state
  if (isSupported === null) {
    return (
      <AppLayout onSettingsClick={() => {}} settingsDisabled onHomeClick={handleHomeClick}>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Unsupported browser
  if (!isSupported) {
    return (
      <AppLayout onSettingsClick={() => {}} settingsDisabled onHomeClick={handleHomeClick}>
        <UnsupportedScreen />
      </AppLayout>
    );
  }

  // Finished state - show result
  if (recorder.state === "finished" && recorder.result && recorder.resultUrl) {
    return (
      <AppLayout
        onSettingsClick={() => setSettingsOpen(true)}
        settingsDisabled={false}
        onHomeClick={handleHomeClick}
      >
        <div className="mx-auto max-w-3xl px-4 py-6">
          <FinishedView
            result={recorder.result}
            resultUrl={recorder.resultUrl}
            resultFile={recorder.resultFile}
            onRecordAgain={recorder.resetRecorder}
          />
        </div>
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          disabled={false}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      onSettingsClick={() => setSettingsOpen(true)}
      settingsDisabled={settingsDisabled}
      onHomeClick={handleHomeClick}
    >
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Format warning banner */}
        {showFormatWarning && (
          <WarningBanner
            message={t("settings.format.mp4Warning")}
            onDismiss={() => setFormatWarningDismissed(true)}
          />
        )}

        {/* Permission denied state */}
        {mediaStream.cameraPermission === "denied" && (
          <PermissionDeniedCard
            title={t("recorder.permissions.denied")}
            description={t("recorder.permissions.deniedDescription")}
            retryLabel={t("recorder.permissions.retry")}
          />
        )}

        {/* Mic denied warning */}
        {mediaStream.micPermission === "denied" && mediaStream.cameraPermission === "granted" && (
          <WarningBanner message={t("recorder.permissions.micDenied")} />
        )}

        {/* Video Preview Area */}
        {mediaStream.cameraPermission !== "denied" && (
          <>
            <div
              ref={videoContainerRef}
              onMouseEnter={controlsVisibility.onMouseEnter}
              onMouseMove={controlsVisibility.onMouseMove}
              onMouseLeave={controlsVisibility.onMouseLeave}
              onClick={controlsVisibility.handleClick}
              className={`relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ${
                isRecordingActive ? "cursor-pointer" : ""
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
              {mediaStream.stream && <VideoPreview stream={mediaStream.stream} />}

              {/* Recording overlay (REC badge + timer) */}
              <RecordingOverlay
                state={recorder.state}
                elapsedMs={recorder.elapsedMs}
                showTimer={controlsVisibility.showControls}
                onClick={controlsVisibility.handleClick}
              />

              {/* Recording controls overlay (when recording/paused) */}
              {isRecordingActive && (
                <RecordingControlsOverlay
                  state={recorder.state as "recording" | "paused"}
                  showControls={controlsVisibility.showControls}
                  onPause={recorder.pauseRecording}
                  onResume={recorder.resumeRecording}
                  onStop={recorder.stopRecording}
                  isMicEnabled={mediaStream.isMicEnabled}
                  micPermissionDenied={mediaStream.micPermission === "denied"}
                  onMicToggle={mediaStream.setMicEnabled}
                  recordingInfo={recorder.recordingInfo}
                  showInfoTooltip={showInfoTooltip}
                  onToggleInfoTooltip={() => setShowInfoTooltip(!showInfoTooltip)}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                />
              )}

              {/* Countdown overlay */}
              {recorder.state === "countdown" && recorder.countdownValue > 0 && (
                <CountdownOverlay value={recorder.countdownValue} />
              )}

              {/* Processing overlay */}
              {recorder.state === "processing" && <ProcessingOverlay />}
            </div>

            {/* Idle controls - below video */}
            {!mediaStream.isLoading && mediaStream.stream && recorder.state === "idle" && (
              <IdleControls
                isMicEnabled={mediaStream.isMicEnabled}
                micPermissionDenied={mediaStream.micPermission === "denied"}
                onMicToggle={() => mediaStream.setMicEnabled(!mediaStream.isMicEnabled)}
                onStartRecording={recorder.startRecording}
                customFilename={customFilename}
                onFilenameChange={setCustomFilename}
                defaultFilename={t("filename.default")}
                videoDevices={mediaStream.videoDevices}
                selectedVideoDeviceId={mediaStream.selectedVideoDeviceId}
                onCameraChange={mediaStream.switchCamera}
              />
            )}
          </>
        )}

        {/* Error display */}
        {(mediaStream.error || recorder.error) && mediaStream.cameraPermission !== "denied" && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            ⚠️ {(() => {
              const error = mediaStream.error || recorder.error;
              if (error?.startsWith("errors.")) {
                return t(error);
              }
              return error;
            })()}
          </div>
        )}
      </div>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        disabled={settingsDisabled}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-gray-900">
          📁 {toastMessage}
        </div>
      )}
    </AppLayout>
  );
}

// Layout wrapper component
function AppLayout({
  children,
  onSettingsClick,
  settingsDisabled,
  onHomeClick,
}: {
  children: React.ReactNode;
  onSettingsClick: () => void;
  settingsDisabled: boolean;
  onHomeClick: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <AppHeader
        onSettingsClick={onSettingsClick}
        settingsDisabled={settingsDisabled}
        onHomeClick={onHomeClick}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// Warning banner component
function WarningBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
      <span>⚠️ {message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

// Permission denied card component
function PermissionDeniedCard({
  title,
  description,
  retryLabel,
}: {
  title: string;
  description: string;
  retryLabel: string;
}) {
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950/30">
      <div className="mb-2 text-4xl">📷</div>
      <h3 className="mb-2 font-semibold text-red-800 dark:text-red-300">{title}</h3>
      <p className="mb-4 text-sm text-red-600 dark:text-red-400">{description}</p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        {retryLabel}
      </button>
    </div>
  );
}
