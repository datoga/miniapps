"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@miniapps/analytics";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import { QrCanvas } from "./QrCanvas";
import { FullscreenModal } from "./FullscreenModal";
import { PrintDialog } from "./PrintDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import type { QrItem } from "../lib/types";
import { downloadPNG, downloadSVG, toPNGBlob, copyToClipboard } from "../lib/qrGenerator";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  item: QrItem | null;
  onUpdateName: (id: string, name: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DetailModal = memo(function DetailModal({
  open,
  onClose,
  item,
  onUpdateName,
  onArchive,
  onDelete,
}: DetailModalProps) {
  const t = useTranslations();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Check share capability
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasShare = !!navigator.share;
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      setCanShare(hasShare && isTouch);
    }
  }, []);

  // Reset name value when item changes
  useEffect(() => {
    if (item) {
      setNameValue(item.name);
    }
  }, [item]);

  const handleNameSave = useCallback(() => {
    if (item && nameValue.trim()) {
      onUpdateName(item.id, nameValue.trim());
    }
    setEditingName(false);
  }, [item, nameValue, onUpdateName]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleNameSave();
      } else if (e.key === "Escape") {
        setNameValue(item?.name || "");
        setEditingName(false);
      }
    },
    [handleNameSave, item]
  );

  const handleCopy = useCallback(async () => {
    if (item) {
      const success = await copyToClipboard(item.data);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [item]);

  const handleDownloadPNG = useCallback(async () => {
    if (item) {
      await downloadPNG(item.data, item.name, item.options);
      trackEvent("qr_download", { format: "png" });
    }
  }, [item]);

  const handleDownloadSVG = useCallback(async () => {
    if (item) {
      await downloadSVG(item.data, item.name, item.options);
      trackEvent("qr_download", { format: "svg" });
    }
  }, [item]);

  const handleFullscreen = useCallback(() => {
    setShowFullscreen(true);
    trackEvent("qr_fullscreen", { from: "detail" });
  }, []);

  const handleShare = useCallback(async () => {
    if (!item || !navigator.share) return;

    try {
      const blob = await toPNGBlob(item.data, item.options);
      const file = new File([blob], `${item.name}.png`, { type: "image/png" });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        // Fallback to sharing URL only
        await navigator.share({ title: item.name, text: item.data });
      } else {
        await navigator.share({ files: [file], title: item.name });
      }
      trackEvent("qr_share", { from: "detail" });
    } catch (error) {
      // User cancelled or error
      console.error("Share error:", error);
    }
  }, [item]);

  const handlePrint = useCallback((copies: number, sizeCm: number) => {
    trackEvent("qr_print", { copies, size_cm: sizeCm });
  }, []);

  const handleArchive = useCallback(() => {
    if (item) {
      const wasArchived = !!item.archivedAt;
      onArchive(item.id);
      trackEvent("qr_archive_toggle", { archived: wasArchived ? 0 : 1 });
    }
  }, [item, onArchive]);

  const handleDeleteConfirm = useCallback(() => {
    if (item) {
      onDelete(item.id);
      trackEvent("qr_delete", { from: "detail" });
      setShowDeleteConfirm(false);
      onClose();
    }
  }, [item, onDelete, onClose]);

  if (!item) return null;

  const isArchived = !!item.archivedAt;
  const kindLabel = item.kind === "url" ? "URL" : item.kind === "text" ? t("card.text") : t("card.other");
  const createdDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <Modal open={open} onClose={onClose} title={t("detail.title")} maxWidth="max-w-2xl">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: QR Preview */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="bg-white dark:bg-gray-100 p-4 rounded-2xl shadow-inner">
              <QrCanvas
                data={item.data}
                options={{ ...item.options, sizePx: 200 }}
              />
            </div>
            <div className="flex gap-2 mt-4">
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
          </div>

          {/* Right: Info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="mb-4">
              {editingName ? (
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  className="w-full text-xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none text-gray-900 dark:text-white"
                />
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-500 transition-colors text-left"
                >
                  {item.name}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="inline ml-2 opacity-50"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.kind === "url"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {kindLabel}
              </span>
              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                {t("detail.created")}: {createdDate}
              </span>
              {isArchived && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {t("card.archived")}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t("detail.content")}
              </label>
              <div className="relative">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 break-all max-h-24 overflow-auto">
                  {item.data}
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-white dark:bg-gray-700 text-gray-500 hover:text-primary-500 shadow-sm transition-colors"
                  title={t("actions.copy")}
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleArchive}>
                {isArchived ? t("actions.unarchive") : t("actions.archive")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
              >
                {t("actions.delete")}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <FullscreenModal
        open={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        item={item}
        onDownloadPNG={handleDownloadPNG}
        onShare={handleShare}
        canShare={canShare}
      />

      <PrintDialog
        open={showPrint}
        onClose={() => setShowPrint(false)}
        item={item}
        onPrint={handlePrint}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteMessage")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
});

