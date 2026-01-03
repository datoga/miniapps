"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@miniapps/analytics";
import { Button } from "@miniapps/ui";
import { QrCanvas } from "./QrCanvas";
import { ConfirmDialog, ThreeOptionDialog } from "./ConfirmDialog";
import { FullscreenModal } from "./FullscreenModal";
import { PrintDialog } from "./PrintDialog";
import type { QrItem, QrOptions, EditorMode, ContentMode } from "../lib/types";
import { DEFAULT_QR_OPTIONS } from "../lib/types";
import { createItem } from "../lib/storage";
import { detectKind, isValidUrl, suggestName } from "../lib/search";
import { downloadPNG, downloadSVG, toPNGBlob } from "../lib/qrGenerator";
import { decodeFromBlob, getVideoDevices, startCameraScanning, stopCameraScanning, resetReader } from "../lib/qrScanner";

interface EditorModalProps {
  open: boolean;
  mode: EditorMode;
  onClose: () => void;
  onSave: (item: QrItem) => void;
}

const SIZE_OPTIONS = [256, 512, 768, 1024];
const ECC_OPTIONS: QrOptions["ecc"][] = ["L", "M", "Q", "H"];

export const EditorModal = memo(function EditorModal({
  open,
  mode,
  onClose,
  onSave,
}: EditorModalProps) {
  const t = useTranslations();

  // Form state
  const [name, setName] = useState("");
  const [data, setData] = useState("");
  const [contentMode, setContentMode] = useState<ContentMode>("url");
  const [options, setOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"camera" | "upload" | "paste" | "url" | null>(null);

  // Dialog states
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  // Camera state
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopScanRef = useRef<(() => void) | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share capability
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasShare = !!navigator.share;
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      setCanShare(hasShare && isTouch);
    }
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setData("");
      setContentMode("url");
      setOptions(DEFAULT_QR_OPTIONS);
      setIsDirty(false);
      setError(null);
      setSource(null);
      setIsScanning(false);
      setCameraError(null);
    } else {
      // Cleanup camera when closing
      stopCameraScanning();
      resetReader();
    }
  }, [open]);

  // Get video devices for read mode
  useEffect(() => {
    if (open && mode === "read") {
      getVideoDevices().then(setDevices);
    }
  }, [open, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraScanning();
      resetReader();
    };
  }, []);

  // Validation
  const isNameValid = name.trim().length > 0;
  const isContentValid = contentMode === "url" ? isValidUrl(data) : data.trim().length > 0;
  const canSave = isNameValid && isContentValid;

  // Auto-suggest name when content becomes valid
  useEffect(() => {
    if (isContentValid && !name) {
      const kind = detectKind(data);
      const suggested = suggestName(data, kind);
      setName(suggested);
    }
  }, [data, isContentValid, name]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setIsDirty(true);
  }, []);

  const handleDataChange = useCallback((value: string) => {
    setData(value);
    setIsDirty(true);
    setError(null);
  }, []);

  const handleOptionChange = useCallback(<K extends keyof QrOptions>(key: K, value: QrOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const kind = detectKind(data);
    const item = createItem(name, data, kind, options);
    onSave(item);

    trackEvent("qr_save", {
      kind,
      source: mode === "read" && source ? source : "create",
      ecc: options.ecc,
      size_px: options.sizePx,
    });

    onClose();
  }, [canSave, name, data, options, mode, source, onSave, onClose]);

  const handleDiscard = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleThreeOptionSave = useCallback(() => {
    if (canSave) {
      handleSave();
    }
    setShowCloseConfirm(false);
  }, [canSave, handleSave]);

  const handleThreeOptionDiscard = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  // Camera handling
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    setCameraError(null);
    setIsScanning(true);

    try {
      const cleanup = startCameraScanning(
        videoRef.current,
        selectedDevice,
        (result) => {
          setData(result);
          setSource("camera");
          setIsDirty(true);
          stopCameraScanning();
          setIsScanning(false);
        },
        (err) => {
          setCameraError(err.message);
          setIsScanning(false);
        }
      );
      stopScanRef.current = cleanup;
    } catch (err) {
      setCameraError(t("editor.cameraError"));
      setIsScanning(false);
    }
  }, [selectedDevice, t]);

  const stopCamera = useCallback(() => {
    stopCameraScanning();
    if (stopScanRef.current) {
      stopScanRef.current();
      stopScanRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // File handling
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const result = await decodeFromBlob(file);

    if (result) {
      setData(result);
      setSource("upload");
      setIsDirty(true);
    } else {
      setError(t("editor.decodeError"));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [t]);

  // Paste handling
  useEffect(() => {
    if (!open) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const result = await decodeFromBlob(blob);
            if (result) {
              setData(result);
              setSource("paste");
              setIsDirty(true);
            } else {
              setError(t("editor.decodeError"));
            }
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [open, t]);

  // Drop handling
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setError(null);
    const result = await decodeFromBlob(file);

    if (result) {
      setData(result);
      setSource("upload");
      setIsDirty(true);
    } else {
      setError(t("editor.decodeError"));
    }
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Download/share handlers for preview
  const handleDownloadPNG = useCallback(async () => {
    if (!data) return;
    await downloadPNG(data, name || "qr-code", options);
    trackEvent("qr_download", { format: "png" });
  }, [data, name, options]);

  const handleDownloadSVG = useCallback(async () => {
    if (!data) return;
    await downloadSVG(data, name || "qr-code", options);
    trackEvent("qr_download", { format: "svg" });
  }, [data, name, options]);

  const handleShare = useCallback(async () => {
    if (!data || !navigator.share) return;

    try {
      const blob = await toPNGBlob(data, options);
      const file = new File([blob], `${name || "qr-code"}.png`, { type: "image/png" });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        await navigator.share({ title: name || "QR Code", text: data });
      } else {
        await navigator.share({ files: [file], title: name || "QR Code" });
      }
      trackEvent("qr_share", { from: "editor" });
    } catch {
      // User cancelled
    }
  }, [data, name, options]);

  const handleFullscreen = useCallback(() => {
    setShowFullscreen(true);
    trackEvent("qr_fullscreen", { from: "editor" });
  }, []);

  const handlePrint = useCallback((copies: number, sizeCm: number) => {
    trackEvent("qr_print", { copies, size_cm: sizeCm });
  }, []);

  // Create a temporary item for preview modals
  const previewItem: QrItem | null = data
    ? {
        id: "preview",
        name: name || "Preview",
        data,
        kind: detectKind(data),
        createdAt: new Date().toISOString(),
        options,
      }
    : null;

  if (!open) return null;

  const title = mode === "create" ? t("editor.createTitle") : t("editor.importTitle");

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
              >
                {t("editor.discard")}
              </Button>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Name input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("editor.name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t("editor.namePlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {!isNameValid && name.length > 0 && (
                <p className="mt-1 text-sm text-red-500">{t("editor.nameRequired")}</p>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Input area */}
              <div className="flex-1">
                {mode === "create" ? (
                  // Create mode
                  <div>
                    {/* Content mode selector */}
                    <div className="flex mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                      <button
                        onClick={() => setContentMode("url")}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          contentMode === "url"
                            ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        URL
                      </button>
                      <button
                        onClick={() => setContentMode("text")}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          contentMode === "text"
                            ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t("editor.text")}
                      </button>
                    </div>

                    {/* Content input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {contentMode === "url" ? "URL" : t("editor.text")} <span className="text-red-500">*</span>
                      </label>
                      {contentMode === "url" ? (
                        <input
                          type="url"
                          value={data}
                          onChange={(e) => handleDataChange(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : (
                        <textarea
                          value={data}
                          onChange={(e) => handleDataChange(e.target.value)}
                          placeholder={t("editor.textPlaceholder")}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                      )}
                      {!isContentValid && data.length > 0 && (
                        <p className="mt-1 text-sm text-red-500">
                          {contentMode === "url" ? t("editor.invalidUrl") : t("editor.textRequired")}
                        </p>
                      )}
                    </div>

                    {/* QR Options */}
                    <div className="space-y-4">
                      {/* Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("editor.size")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {SIZE_OPTIONS.map((size) => (
                            <button
                              key={size}
                              onClick={() => handleOptionChange("sizePx", size)}
                              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                options.sizePx === size
                                  ? "bg-primary-500 text-white border-primary-500"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400"
                              }`}
                            >
                              {size}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ECC */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("editor.errorCorrection")}
                        </label>
                        <div className="flex gap-2">
                          {ECC_OPTIONS.map((ecc) => (
                            <button
                              key={ecc}
                              onClick={() => handleOptionChange("ecc", ecc)}
                              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                                options.ecc === ecc
                                  ? "bg-primary-500 text-white border-primary-500"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400"
                              }`}
                            >
                              {ecc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Margin */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("editor.margin")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={options.margin}
                          onChange={(e) => handleOptionChange("margin", parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Read mode
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                  >
                    {/* Camera section */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {t("editor.camera")}
                      </h3>
                      <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-3">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                        />
                        {!isScanning && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {devices.length > 1 && (
                          <select
                            value={selectedDevice || ""}
                            onChange={(e) => setSelectedDevice(e.target.value || null)}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          >
                            {devices.map((device) => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                              </option>
                            ))}
                          </select>
                        )}
                        <Button
                          onClick={isScanning ? stopCamera : startCamera}
                          variant={isScanning ? "outline" : "primary"}
                        >
                          {isScanning ? t("editor.stopScan") : t("editor.startScan")}
                        </Button>
                      </div>
                      {cameraError && (
                        <p className="mt-2 text-sm text-red-500">{cameraError}</p>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                      <span className="text-sm text-gray-500">{t("editor.or")}</span>
                      <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    </div>

                    {/* Upload section */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {t("editor.dropOrPaste")}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {t("editor.selectFile")}
                      </Button>
                    </div>

                    {/* Decoded content */}
                    {data && (
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                          {t("editor.decoded")}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                          {data}
                        </p>
                      </div>
                    )}

                    {error && (
                      <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Preview */}
              <div className="lg:w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t("editor.preview")}
                  </h3>
                  <div className="bg-white dark:bg-gray-100 p-4 rounded-2xl shadow-inner flex items-center justify-center">
                    <QrCanvas
                      data={data}
                      options={{ ...options, sizePx: 200 }}
                    />
                  </div>

                  {/* Preview actions */}
                  {data && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={t("actions.fullscreen")}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDownloadPNG}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={t("actions.downloadPNG")}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDownloadSVG}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={t("actions.downloadSVG")}
                      >
                        <span className="text-xs font-bold">SVG</span>
                      </button>
                      <button
                        onClick={() => setShowPrint(true)}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={t("actions.print")}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                      </button>
                      {canShare && (
                        <button
                          onClick={handleShare}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title={t("actions.share")}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end gap-3 p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800">
            <Button variant="secondary" onClick={handleClose}>
              {t("common.close")}
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {t("editor.saveToLibrary")}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showDiscardConfirm}
        title={t("editor.discardTitle")}
        message={t("editor.discardMessage")}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
        confirmLabel={t("editor.discard")}
        variant="danger"
      />

      <ThreeOptionDialog
        open={showCloseConfirm}
        title={t("editor.unsavedTitle")}
        message={t("editor.unsavedMessage")}
        onSave={handleThreeOptionSave}
        onDiscard={handleThreeOptionDiscard}
        onCancel={() => setShowCloseConfirm(false)}
        saveDisabled={!canSave}
      />

      <FullscreenModal
        open={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        item={previewItem}
        onDownloadPNG={handleDownloadPNG}
        onShare={handleShare}
        canShare={canShare}
      />

      <PrintDialog
        open={showPrint}
        onClose={() => setShowPrint(false)}
        item={previewItem}
        onPrint={handlePrint}
      />
    </>
  );
});

