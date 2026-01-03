"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect } from "react";
import type { QrItem } from "../lib/types";
import { DownloadDropdown, type DownloadFormat } from "./DownloadDropdown";
import { QrCanvas } from "./QrCanvas";

interface FullscreenModalProps {
  open: boolean;
  onClose: () => void;
  item: QrItem | null;
  onDownload: (format: DownloadFormat) => void;
  onShare: () => void;
  canShare: boolean;
}

export const FullscreenModal = memo(function FullscreenModal({
  open,
  onClose,
  item,
  onDownload,
  onShare,
  canShare,
}: FullscreenModalProps) {
  const t = useTranslations();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open || !item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* QR Code */}
      <div className="flex flex-col items-center">
        <QrCanvas
          data={item.data}
          options={{ ...item.options, sizePx: Math.min(600, window.innerWidth - 80) }}
          className="bg-white p-4 rounded-2xl"
        />
        <p className="text-white text-lg font-semibold mt-4">{item.name}</p>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
        <DownloadDropdown onDownload={onDownload} variant="fullscreen" direction="up" showLabel />
        {canShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg
              width="20"
              height="20"
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
            {t("actions.share")}
          </button>
        )}
      </div>
    </div>
  );
});
