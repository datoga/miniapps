"use client";

import { memo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import type { QrItem } from "../lib/types";
import { toDataURL } from "../lib/qrGenerator";

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  item: QrItem | null;
  onPrint: (copies: number, sizeCm: number) => void;
}

const SIZE_OPTIONS = [3, 4, 5, 6, 8, 10];
const COPY_OPTIONS = [1, 2, 4, 6, 9, 12, 16];

export const PrintDialog = memo(function PrintDialog({
  open,
  onClose,
  item,
  onPrint,
}: PrintDialogProps) {
  const t = useTranslations();
  const [sizeCm, setSizeCm] = useState(5);
  const [copies, setCopies] = useState(1);
  const [showName, setShowName] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(async () => {
    if (!item) return;
    setIsPrinting(true);

    try {
      // Generate high-quality QR image
      const dataUrl = await toDataURL(item.data, 512, item.options);
      const sizePx = Math.round(sizeCm * 37.8); // Approx 96 DPI

      // Create print window
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert(t("print.popupBlocked"));
        setIsPrinting(false);
        return;
      }

      // Build grid HTML
      const items = Array(copies)
        .fill(null)
        .map(
          () => `
        <div class="qr-item" style="break-inside: avoid; padding: 8px; text-align: center;">
          <img src="${dataUrl}" alt="QR Code" style="width: ${sizePx}px; height: ${sizePx}px;" />
          ${showName ? `<div style="font-size: 12px; font-weight: bold; margin-top: 4px;">${item.name}</div>` : ""}
          ${showContent ? `<div style="font-size: 10px; color: #666; word-break: break-all; max-width: ${sizePx}px;">${item.data.substring(0, 100)}${item.data.length > 100 ? "..." : ""}</div>` : ""}
        </div>
      `
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${t("print.title")} - ${item.name}</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                margin: 0;
                padding: 16px;
              }
              .grid {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                justify-content: flex-start;
              }
              @media print {
                body { padding: 0; }
                .qr-item { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="grid">${items}</div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      onPrint(copies, sizeCm);
      onClose();
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  }, [item, copies, sizeCm, showName, showContent, t, onPrint, onClose]);

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} title={t("print.title")}>
      <div className="space-y-6">
        {/* Size selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("print.size")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => setSizeCm(size)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  sizeCm === size
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400"
                }`}
              >
                {size} cm
              </button>
            ))}
          </div>
        </div>

        {/* Copies selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("print.copies")}
          </label>
          <div className="flex flex-wrap gap-2">
            {COPY_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setCopies(count)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  copies === count
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showName}
              onChange={(e) => setShowName(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("print.showName")}
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showContent}
              onChange={(e) => setShowContent(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("print.showContent")}
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? t("print.printing") : t("print.print")}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

