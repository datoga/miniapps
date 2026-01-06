"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useState, useEffect } from "react";
import { Modal, ConfirmDialog } from "@miniapps/ui";
import {
  type RecorderSettings,
  type QualityPreset,
  type CameraDefault,
  QUALITY_PRESETS,
  DEFAULT_SETTINGS,
  pickDirectory,
  getFolderHandle,
  verifyFolderPermission,
  clearFolderHandle,
} from "@/lib/settings";
import { trackSettingsChanged } from "@/lib/ga";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings: RecorderSettings;
  onSettingsChange: (settings: RecorderSettings) => void;
  disabled: boolean;
}

const COUNTDOWN_OPTIONS = [0, 3, 5, 10];

export const SettingsSheet = memo(function SettingsSheet({
  open,
  onClose,
  settings,
  onSettingsChange,
  disabled,
}: SettingsSheetProps) {
  const t = useTranslations();
  const [folderName, setFolderName] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load folder name on open
  useEffect(() => {
    if (open) {
      loadFolderName();
    }
  }, [open]);

  const loadFolderName = async () => {
    const handle = await getFolderHandle();
    if (handle) {
      const hasPermission = await verifyFolderPermission(handle);
      setFolderName(hasPermission ? handle.name : null);
    } else {
      setFolderName(null);
    }
  };

  const handleChooseFolder = useCallback(async () => {
    const handle = await pickDirectory();
    if (handle) {
      setFolderName(handle.name);
      trackSettingsChanged("folder");
    }
  }, []);

  const handleCountdownChange = useCallback(
    (value: number) => {
      onSettingsChange({ ...settings, countdownSeconds: value });
      trackSettingsChanged("countdown");
    },
    [settings, onSettingsChange]
  );

  const handleQualityChange = useCallback(
    (preset: QualityPreset) => {
      onSettingsChange({ ...settings, qualityPreset: preset });
      trackSettingsChanged("quality");
    },
    [settings, onSettingsChange]
  );

  const handleCustomQualityChange = useCallback(
    (field: keyof RecorderSettings["customQuality"], value: number) => {
      onSettingsChange({
        ...settings,
        customQuality: { ...settings.customQuality, [field]: value },
      });
    },
    [settings, onSettingsChange]
  );

  const handleFormatChange = useCallback(
    (preferMp4: boolean) => {
      onSettingsChange({ ...settings, preferMp4 });
      trackSettingsChanged("format");
    },
    [settings, onSettingsChange]
  );

  const handleMicDefaultChange = useCallback(
    (micDefaultOn: boolean) => {
      onSettingsChange({ ...settings, micDefaultOn });
      trackSettingsChanged("mic_default");
    },
    [settings, onSettingsChange]
  );

  const handleCameraDefaultChange = useCallback(
    (cameraDefault: CameraDefault) => {
      onSettingsChange({ ...settings, cameraDefault });
      trackSettingsChanged("camera_default");
    },
    [settings, onSettingsChange]
  );

  const handleResetClick = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(async () => {
    // Reset settings to defaults
    onSettingsChange(DEFAULT_SETTINGS);
    // Clear folder handle
    await clearFolderHandle();
    setFolderName(null);
    trackSettingsChanged("reset_to_defaults");
    setShowResetConfirm(false);
  }, [onSettingsChange]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("settings.title")}
      size="md"
      closeLabel={t("common.close")}
    >
      {disabled && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          ⚠️ {t("settings.disabled")}
        </div>
      )}

      <div className="space-y-6">
        {/* Save Location */}
        <section>
          <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
            📁 {t("settings.saveLocation.title")}
          </h3>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {t("settings.saveLocation.description")}
          </p>
          <button
            onClick={handleChooseFolder}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {folderName
              ? t("settings.saveLocation.currentFolder", { folder: folderName })
              : t("settings.saveLocation.chooseFolder")}
          </button>
        </section>

        {/* Countdown */}
        <section>
          <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
            ⏱️ {t("settings.countdown.title")}
          </h3>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {t("settings.countdown.description")}
          </p>
          <div className="flex gap-2">
            {COUNTDOWN_OPTIONS.map((seconds) => (
              <button
                key={seconds}
                onClick={() => handleCountdownChange(seconds)}
                disabled={disabled}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  settings.countdownSeconds === seconds
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {seconds === 0
                  ? t("settings.countdown.none")
                  : t("settings.countdown.seconds", { count: seconds })}
              </button>
            ))}
          </div>
        </section>

        {/* Quality */}
        <section>
          <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
            📹 {t("settings.quality.title")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(["low", "standard", "high", "custom"] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handleQualityChange(preset)}
                disabled={disabled}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  settings.qualityPreset === preset
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t(`settings.quality.${preset}`)}
              </button>
            ))}
          </div>

          {/* Custom Quality Inputs */}
          {settings.qualityPreset === "custom" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ {t("settings.quality.customWarning")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("settings.quality.width")}
                  </label>
                  <input
                    type="number"
                    value={settings.customQuality.width}
                    onChange={(e) =>
                      handleCustomQualityChange("width", parseInt(e.target.value) || 1280)
                    }
                    disabled={disabled}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 disabled:opacity-50"
                    min={320}
                    max={3840}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("settings.quality.height")}
                  </label>
                  <input
                    type="number"
                    value={settings.customQuality.height}
                    onChange={(e) =>
                      handleCustomQualityChange("height", parseInt(e.target.value) || 720)
                    }
                    disabled={disabled}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 disabled:opacity-50"
                    min={240}
                    max={2160}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("settings.quality.fps")}
                  </label>
                  <input
                    type="number"
                    value={settings.customQuality.fps}
                    onChange={(e) =>
                      handleCustomQualityChange("fps", parseInt(e.target.value) || 30)
                    }
                    disabled={disabled}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 disabled:opacity-50"
                    min={15}
                    max={60}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("settings.quality.bitrate")}
                  </label>
                  <input
                    type="number"
                    value={settings.customQuality.bitrateMbps}
                    onChange={(e) =>
                      handleCustomQualityChange(
                        "bitrateMbps",
                        parseFloat(e.target.value) || 2.5
                      )
                    }
                    disabled={disabled}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 disabled:opacity-50"
                    min={0.5}
                    max={20}
                    step={0.5}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Show preset values */}
          {settings.qualityPreset !== "custom" && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {QUALITY_PRESETS[settings.qualityPreset].width}x
              {QUALITY_PRESETS[settings.qualityPreset].height} @{" "}
              {QUALITY_PRESETS[settings.qualityPreset].fps}fps,{" "}
              {QUALITY_PRESETS[settings.qualityPreset].bitrateMbps}Mbps
            </div>
          )}
        </section>

        {/* Format */}
        <section>
          <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
            🎬 {t("settings.format.title")}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleFormatChange(true)}
              disabled={disabled}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                settings.preferMp4
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("settings.format.preferMp4")}
            </button>
            <button
              onClick={() => handleFormatChange(false)}
              disabled={disabled}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                !settings.preferMp4
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("settings.format.preferWebm")}
            </button>
          </div>
        </section>

        {/* Microphone Default */}
        <section>
          <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
            🎙️ {t("settings.mic.title")}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleMicDefaultChange(true)}
              disabled={disabled}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                settings.micDefaultOn
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("settings.mic.on")}
            </button>
            <button
              onClick={() => handleMicDefaultChange(false)}
              disabled={disabled}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                !settings.micDefaultOn
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("settings.mic.off")}
            </button>
          </div>
        </section>

        {/* Camera Default */}
        <section>
          <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
            📷 {t("settings.camera.title")}
          </h3>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {t("settings.camera.description")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleCameraDefaultChange("front")}
              disabled={disabled}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                settings.cameraDefault === "front"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("settings.camera.front")}
            </button>
            <button
              onClick={() => handleCameraDefaultChange("back")}
              disabled={disabled}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                settings.cameraDefault === "back"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("settings.camera.back")}
            </button>
          </div>
        </section>

        {/* Reset to Defaults */}
        <section className="border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            onClick={handleResetClick}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-red-400"
          >
            🔄 {t("settings.resetToDefaults")}
          </button>
        </section>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={showResetConfirm}
        title={t("settings.resetConfirm.title")}
        message={t("settings.resetConfirm.message")}
        confirmLabel={t("settings.resetConfirm.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        variant="warning"
      />
    </Modal>
  );
});

