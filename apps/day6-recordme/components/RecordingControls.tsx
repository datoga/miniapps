"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import type { MediaDevice } from "@/lib/useMediaStream";

interface RecordingControlsProps {
  videoDevices: MediaDevice[];
  selectedVideoDeviceId: string | null;
  onCameraChange: (deviceId: string) => void;
  // File naming
  customFilename: string;
  onFilenameChange: (filename: string) => void;
}

export const RecordingControls = memo(function RecordingControls({
  videoDevices,
  selectedVideoDeviceId,
  onCameraChange,
  customFilename,
  onFilenameChange,
}: RecordingControlsProps) {
  const t = useTranslations();

  return (
    <div className="flex w-full items-center justify-between gap-4">
      {/* Camera Selector - left side (only show if multiple cameras) */}
      <div className="flex-shrink-0">
        {videoDevices.length > 1 ? (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
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
        ) : (
          <div /> // Empty placeholder for alignment
        )}
      </div>

      {/* Filename input - right side */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <label className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          {t("filename.label")}:
        </label>
        <input
          type="text"
          value={customFilename}
          onChange={(e) => onFilenameChange(e.target.value)}
          placeholder={t("filename.placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>
    </div>
  );
});

