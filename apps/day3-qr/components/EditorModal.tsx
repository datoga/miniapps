"use client";

import { trackEvent } from "@miniapps/analytics";
import { Button } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { downloadJPG, downloadPNG, downloadSVG, downloadWebP, toPNGBlob } from "../lib/qrGenerator";
import {
  decodeFromBlob,
  getVideoDevices,
  resetReader,
  startCameraScanning,
  stopCameraScanning,
} from "../lib/qrScanner";
import { detectKind, isValidUrl, suggestName } from "../lib/search";
import { createItem } from "../lib/storage";
import type { ContentMode, EditorMode, QrItem, QrOptions } from "../lib/types";
import { DEFAULT_QR_OPTIONS } from "../lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { DownloadDropdown } from "./DownloadDropdown";
import { FullscreenModal } from "./FullscreenModal";
import { PrintDialog } from "./PrintDialog";
import { QrCanvas } from "./QrCanvas";

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
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"camera" | "upload" | "paste" | "url" | null>(null);

  // Dialog states
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // Ref for pause timeout
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Function to start continuous scanning
  const startContinuousScanning = useCallback((deviceId: string | null) => {
    if (!videoRef.current) {
      return;
    }

    setCameraError(null);
    setIsScanning(true);
    setIsPaused(false);

    const cleanup = startCameraScanning(
      videoRef.current,
      deviceId,
      (result) => {
        // QR detected - pause for 5 seconds then resume
        setData(result);
        setSource("camera");
        setIsPaused(true);

        // Clear any existing timeout
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
        }

        // Resume scanning after 5 seconds
        pauseTimeoutRef.current = setTimeout(() => {
          setIsPaused(false);
          // Scanner continues automatically - no need to restart
        }, 5000);
      },
      (err) => {
        setCameraError(err.message);
        setIsScanning(false);
      }
    );
    stopScanRef.current = cleanup;
  }, []);

  // Get video devices and auto-start camera for scan mode
  useEffect(() => {
    if (open && mode === "scan") {
      getVideoDevices().then((devs) => {
        setDevices(devs);
        // Auto-start camera after getting devices
        if (videoRef.current && !isScanning) {
          // Prefer back camera (environment facing) over front camera
          const backCamera = devs.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment") ||
              d.label.toLowerCase().includes("trasera")
          );
          const preferredDevice = backCamera || devs[0];
          if (preferredDevice) {
            setSelectedDevice(preferredDevice.deviceId);
          }
          startContinuousScanning(preferredDevice ? preferredDevice.deviceId : null);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraScanning();
      resetReader();
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  // Validation
  const isNameValid = name.trim().length > 0;
  const isContentValid = contentMode === "url" ? isValidUrl(data) : data.trim().length > 0;
  const canSave = isNameValid && isContentValid;

  // Auto-suggest name when decoding QR in scan/import mode
  useEffect(() => {
    if ((mode === "scan" || mode === "import") && data && !name) {
      const kind = detectKind(data);
      const suggested = suggestName(data, kind);
      if (suggested) {
        setName(suggested);
      }
    }
  }, [mode, data, name]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
  }, []);

  const handleDataChange = useCallback((value: string) => {
    setData(value);
    setError(null);
  }, []);

  const handleOptionChange = useCallback(
    <K extends keyof QrOptions>(key: K, value: QrOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!canSave) {
      return;
    }

    const kind = detectKind(data);
    const item = createItem(name, data, kind, options);
    onSave(item);

    trackEvent("qr_save", {
      kind,
      source: (mode === "scan" || mode === "import") && source ? source : "create",
      ecc: options.ecc,
      size_px: options.sizePx,
    });

    onClose();
  }, [canSave, name, data, options, mode, source, onSave, onClose]);

  const handleClose = useCallback(() => {
    // Show confirmation if there's content that would be lost
    if (data.trim()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [data, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  // ESC key to close modal
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  // Camera handling
  const startCamera = useCallback(async () => {
    startContinuousScanning(selectedDevice);
  }, [selectedDevice, startContinuousScanning]);

  const stopCamera = useCallback(() => {
    stopCameraScanning();
    if (stopScanRef.current) {
      stopScanRef.current();
      stopScanRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    setIsScanning(false);
    setIsPaused(false);
  }, []);

  // File handling
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      setError(null);
      const result = await decodeFromBlob(file);

      if (result) {
        setData(result);
        setSource("upload");
      } else {
        setError(t("editor.decodeError"));
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [t]
  );

  // Paste handling
  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const result = await decodeFromBlob(blob);
            if (result) {
              setData(result);
              setSource("paste");
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
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        return;
      }

      setError(null);
      const result = await decodeFromBlob(file);

      if (result) {
        setData(result);
        setSource("upload");
      } else {
        setError(t("editor.decodeError"));
      }
    },
    [t]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Download handler for preview
  const handleDownload = useCallback(
    async (format: "png" | "svg" | "jpg" | "webp") => {
      if (!data) {
        return;
      }

      const filename = name || "qr-code";
      switch (format) {
        case "png":
          await downloadPNG(data, filename, options);
          break;
        case "jpg":
          await downloadJPG(data, filename, options);
          break;
        case "svg":
          await downloadSVG(data, filename, options);
          break;
        case "webp":
          await downloadWebP(data, filename, options);
          break;
      }
      trackEvent("qr_download", { format });
    },
    [data, name, options]
  );

  const handleShare = useCallback(async () => {
    if (!data || !navigator.share) {
      return;
    }

    const qrName = name || "QR Code";
    const shareText = [`📱 ${qrName}`, "", "✨ Creado con QRKit", "🔗 qrkit.pro"].join("\n");

    try {
      const blob = await toPNGBlob(data, options);
      const file = new File([blob], `${qrName}.png`, { type: "image/png" });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        await navigator.share({ title: qrName, text: shareText });
      } else {
        await navigator.share({ files: [file], title: qrName, text: shareText });
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

  if (!open) {
    return null;
  }

  const getTitle = () => {
    if (mode === "create") {
      return t("editor.createTitle");
    }
    if (mode === "scan") {
      return t("editor.scanTitle");
    }
    return t("editor.importTitle");
  };
  const title = getTitle();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={handleClose} />

        {/* Modal */}
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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
                {mode === "create" && (
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
                        {contentMode === "url" ? "URL" : t("editor.text")}{" "}
                        <span className="text-red-500">*</span>
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
                          {contentMode === "url"
                            ? t("editor.invalidUrl")
                            : t("editor.textRequired")}
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
                          onChange={(e) =>
                            handleOptionChange("margin", parseInt(e.target.value) || 0)
                          }
                          className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {mode === "scan" && (
                  // Scan mode - Camera only (auto-starts)
                  <div>
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-3">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                      {!isScanning && !cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
                          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                          <p className="text-white/70 text-sm">{t("editor.startingCamera")}</p>
                        </div>
                      )}
                      {isScanning && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Scan frame overlay */}
                          <div
                            className={`absolute inset-8 border-2 rounded-lg transition-colors ${isPaused ? "border-green-400" : "border-white/50"}`}
                          />
                          <div
                            className={`absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg transition-colors ${isPaused ? "border-green-400" : "border-primary-400"}`}
                          />
                          <div
                            className={`absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg transition-colors ${isPaused ? "border-green-400" : "border-primary-400"}`}
                          />
                          <div
                            className={`absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg transition-colors ${isPaused ? "border-green-400" : "border-primary-400"}`}
                          />
                          <div
                            className={`absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 rounded-br-lg transition-colors ${isPaused ? "border-green-400" : "border-primary-400"}`}
                          />
                          {isPaused && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                {t("editor.detected")}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Camera switch button */}
                    {devices.length > 1 && (
                      <button
                        onClick={() => {
                          // Find current index and switch to next camera
                          const currentIndex = devices.findIndex(
                            (d) => d.deviceId === selectedDevice
                          );
                          const nextIndex = (currentIndex + 1) % devices.length;
                          const nextDevice = devices[nextIndex];
                          if (nextDevice) {
                            setSelectedDevice(nextDevice.deviceId);
                            // Restart camera with new device
                            stopCamera();
                            setTimeout(() => startCamera(), 100);
                          }
                        }}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                          <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                          <circle cx="12" cy="12" r="3" />
                          <path d="m18 22-3-3 3-3" />
                          <path d="m6 2 3 3-3 3" />
                        </svg>
                        <span className="text-sm font-medium">{t("editor.switchCamera")}</span>
                      </button>
                    )}
                    {cameraError && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">{cameraError}</p>
                        <Button onClick={startCamera} variant="secondary" className="mt-2">
                          {t("editor.retryCamera")}
                        </Button>
                      </div>
                    )}

                    {/* Decoded content */}
                    {data && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-green-600 dark:text-green-400"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            {t("editor.decoded")}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-all bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          {data}
                        </p>
                      </div>
                    )}

                    {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
                  </div>
                )}

                {mode === "import" && (
                  // Import mode - File upload/drop/paste only
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {/* Upload/Drop section */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-10 transition-colors ${
                        isDragging
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10"
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-gray-400 dark:text-gray-500"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <p className="text-base text-gray-600 dark:text-gray-300 mb-1 font-medium">
                          {t("editor.dropOrPaste")}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
                          PNG, JPG, GIF, WebP
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          {t("editor.selectFile")}
                        </Button>
                      </div>
                    </div>

                    {/* Decoded content */}
                    {data && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-green-600 dark:text-green-400"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            {t("editor.decoded")}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-all bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          {data}
                        </p>
                      </div>
                    )}

                    {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
                  </div>
                )}
              </div>

              {/* Right: Preview */}
              <div className="lg:w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t("editor.preview")}
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-center">
                    <QrCanvas data={data} options={{ ...options, sizePx: 200 }} />
                  </div>

                  {/* Show decoded content below preview */}
                  {data && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                        {t("detail.content")}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-all line-clamp-3">
                        {data}
                      </p>
                    </div>
                  )}

                  {/* Preview actions */}
                  {data && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={t("actions.fullscreen")}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                      </button>
                      <DownloadDropdown onDownload={handleDownload} size="sm" direction="up" />
                      <button
                        onClick={() => setShowPrint(true)}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={t("actions.print")}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
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
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
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
        open={showCloseConfirm}
        title={t("editor.closeTitle")}
        message={t("editor.closeMessage")}
        onConfirm={handleConfirmClose}
        onCancel={() => setShowCloseConfirm(false)}
        confirmLabel={t("editor.closeConfirm")}
        variant="danger"
      />

      <FullscreenModal
        open={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        item={previewItem}
        onDownload={handleDownload}
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
