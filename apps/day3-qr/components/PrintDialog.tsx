"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
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
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customSizeValue, setCustomSizeValue] = useState("7");
  const customInputRef = useRef<HTMLInputElement>(null);
  const [copies, setCopies] = useState(1);

  // Focus custom input when switching to custom mode
  useEffect(() => {
    if (isCustomSize && customInputRef.current) {
      customInputRef.current.focus();
      customInputRef.current.select();
    }
  }, [isCustomSize]);

  const handleSizeSelect = useCallback((size: number) => {
    setSizeCm(size);
    setIsCustomSize(false);
  }, []);

  const handleCustomSizeClick = useCallback(() => {
    setIsCustomSize(true);
    const customValue = parseFloat(customSizeValue) || 7;
    setSizeCm(customValue);
  }, [customSizeValue]);

  const handleCustomSizeChange = useCallback((value: string) => {
    setCustomSizeValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 30) {
      setSizeCm(numValue);
    }
  }, []);
  const [showName, setShowName] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(async () => {
    if (!item) {return;}
    setIsPrinting(true);

    try {
      // Generate high-quality QR image
      const dataUrl = await toDataURL(item.data, 512, item.options);
      const sizePx = Math.round(sizeCm * 37.8); // Approx 96 DPI

      // Build grid HTML
      const items = Array(copies)
        .fill(null)
        .map(
          () => `
        <div class="qr-item">
          <div class="qr-wrapper">
            <img src="${dataUrl}" alt="QR Code" style="width: ${sizePx}px; height: ${sizePx}px;" />
          </div>
          ${showName ? `<div class="qr-name">${item.name}</div>` : ""}
          ${showContent ? `<div class="qr-content" style="max-width: ${sizePx}px;">${item.data.substring(0, 100)}${item.data.length > 100 ? "..." : ""}</div>` : ""}
        </div>
      `
        )
        .join("");

      const printDate = new Date().toLocaleDateString();

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${t("print.title")} - ${item.name}</title>
            <style>
              * {
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 0;
                color: #1a1a1a;
              }
              .page {
                padding: 24px;
                min-height: 100vh;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-bottom: 16px;
                margin-bottom: 24px;
                border-bottom: 2px solid #0ea5e9;
              }
              .brand {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .brand-icon {
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #0ea5e9, #0284c7);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
              }
              .brand-text {
                font-size: 20px;
                font-weight: 700;
                color: #0ea5e9;
              }
              .header-info {
                text-align: right;
                font-size: 11px;
                color: #666;
              }
              .header-info .title {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
              }
              .grid {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: flex-start;
              }
              .qr-item {
                break-inside: avoid;
                padding: 12px;
                text-align: center;
                background: #fafafa;
                border-radius: 12px;
                border: 1px solid #e5e5e5;
              }
              .qr-wrapper {
                background: white;
                padding: 8px;
                border-radius: 8px;
                display: inline-block;
              }
              .qr-name {
                font-size: 13px;
                font-weight: 600;
                margin-top: 8px;
                color: #1a1a1a;
              }
              .qr-content {
                font-size: 10px;
                color: #666;
                word-break: break-all;
                margin-top: 4px;
                font-family: 'SF Mono', Monaco, monospace;
              }
              .footer {
                margin-top: 32px;
                padding-top: 16px;
                border-top: 1px solid #e5e5e5;
                text-align: center;
                font-size: 10px;
                color: #999;
              }
              @media print {
                body { padding: 0; }
                .page { padding: 16px; min-height: auto; }
                .qr-item { page-break-inside: avoid; }
                .footer { position: fixed; bottom: 16px; left: 0; right: 0; }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="header">
                <div class="brand">
                  <div class="brand-icon">QR</div>
                  <div class="brand-text">QRKit</div>
                </div>
                <div class="header-info">
                  <div class="title">${item.name}</div>
                  <div>${printDate} · ${copies} ${copies === 1 ? 'copy' : 'copies'} · ${sizeCm}cm</div>
                </div>
              </div>
              <div class="grid">${items}</div>
              <div class="footer">
                Generated with QRKit · qrkit.vercel.app
              </div>
            </div>
          </body>
        </html>
      `;

      // Create hidden iframe for printing (avoids new tab issue)
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        setIsPrinting(false);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for images to load, then print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // Remove iframe after a delay (give time for print dialog)
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 100);
      };

      onPrint(copies, sizeCm);
      onClose();
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  }, [item, copies, sizeCm, showName, showContent, t, onPrint, onClose]);

  if (!item) {return null;}

  return (
    <Modal open={open} onClose={onClose} title={t("print.title")}>
      <div className="space-y-6">
        {/* Size selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("print.size")}
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeSelect(size)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  sizeCm === size && !isCustomSize
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 text-gray-700 dark:text-gray-300"
                }`}
              >
                {size} cm
              </button>
            ))}
            {isCustomSize ? (
              <div className="flex items-center gap-1">
                <input
                  ref={customInputRef}
                  type="number"
                  min="1"
                  max="30"
                  step="0.5"
                  value={customSizeValue}
                  onChange={(e) => handleCustomSizeChange(e.target.value)}
                  className="w-16 px-2 py-2 text-sm rounded-lg border border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">cm</span>
              </div>
            ) : (
              <button
                onClick={handleCustomSizeClick}
                className="px-3 py-2 text-sm rounded-lg border transition-colors bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 text-gray-700 dark:text-gray-300"
              >
                {t("print.custom")}
              </button>
            )}
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

