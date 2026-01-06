"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { MicOnIcon, MicOffIcon, EditIcon, CloseIcon, CameraIcon } from "./Icons";
import type { MediaDevice } from "@/lib/useMediaStream";

interface IdleControlsProps {
  // Mic
  isMicEnabled: boolean;
  micPermissionDenied: boolean;
  onMicToggle: () => void;
  // Recording
  onStartRecording: () => void;
  // Filename
  customFilename: string;
  onFilenameChange: (filename: string) => void;
  defaultFilename: string;
  // Camera
  videoDevices: MediaDevice[];
  selectedVideoDeviceId: string | null;
  onCameraChange: (deviceId: string) => void;
}

export const IdleControls = memo(function IdleControls({
  isMicEnabled,
  micPermissionDenied,
  onMicToggle,
  onStartRecording,
  customFilename,
  onFilenameChange,
  defaultFilename,
  videoDevices,
  selectedVideoDeviceId,
  onCameraChange,
}: IdleControlsProps) {
  const t = useTranslations();

  return (
    <>
      {/* Main controls row */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {/* Mic toggle */}
        {!micPermissionDenied && (
          <button
            onClick={onMicToggle}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isMicEnabled
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
            }`}
            title={isMicEnabled ? t("mic.on") : t("mic.off")}
          >
            {isMicEnabled ? <MicOnIcon /> : <MicOffIcon />}
          </button>
        )}

        {/* Record Button */}
        <button
          onClick={onStartRecording}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:bg-red-500 hover:scale-105 active:scale-95"
          title={t("controls.record")}
        >
          <div className="h-6 w-6 rounded-full bg-white" />
        </button>

        {/* Filename toggle */}
        <FilenameControl
          customFilename={customFilename}
          onFilenameChange={onFilenameChange}
          defaultFilename={defaultFilename}
        />
      </div>

      {/* Camera selector - only show if multiple cameras */}
      {videoDevices.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <CameraIcon className="h-4 w-4 text-gray-400" />
          <select
            value={selectedVideoDeviceId || ""}
            onChange={(e) => onCameraChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
});

// Filename control sub-component
const FilenameControl = memo(function FilenameControl({
  customFilename,
  onFilenameChange,
  defaultFilename,
}: {
  customFilename: string;
  onFilenameChange: (filename: string) => void;
  defaultFilename: string;
}) {
  const t = useTranslations();

  if (customFilename) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customFilename}
          onChange={(e) => {
            const value = e.target.value.replace(/\.(mp4|webm|mkv|avi|mov|m4v)$/gi, "");
            onFilenameChange(value);
          }}
          onBlur={() => {
            if (!customFilename.trim()) {
              onFilenameChange("");
            }
          }}
          onFocus={(e) => e.target.select()}
          placeholder={defaultFilename}
          className="w-40 rounded-lg bg-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-200"
          autoFocus
        />
        <button
          onClick={() => onFilenameChange("")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
          title="Auto"
        >
          <CloseIcon />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onFilenameChange(defaultFilename)}
      className="flex items-center gap-2 rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      title={t("filename.label")}
    >
      <EditIcon />
      auto
    </button>
  );
});

