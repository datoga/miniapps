"use client";

import { useTranslations } from "next-intl";
import { memo, useEffect, useMemo, useRef } from "react";
import { renderToCanvas } from "../lib/qrGenerator";
import type { QrOptions } from "../lib/types";
import { DEFAULT_QR_OPTIONS } from "../lib/types";

interface QrCanvasProps {
  data: string;
  options?: Partial<QrOptions>;
  className?: string;
}

/**
 * QR Code canvas component
 * Renders a QR code to canvas with live updates
 */
export const QrCanvas = memo(function QrCanvas({
  data,
  options = {},
  className = "",
}: QrCanvasProps) {
  const t = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const opts = useMemo(() => ({ ...DEFAULT_QR_OPTIONS, ...options }), [options]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Render QR code to canvas
    renderToCanvas(canvas, data, opts).catch(console.error);
  }, [data, opts]);

  if (!data) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700/50 rounded-xl border border-gray-300 dark:border-gray-600 ${className}`}
        style={{ width: opts.sizePx, height: opts.sizePx, maxWidth: "100%" }}
      >
        <span className="text-gray-500 dark:text-gray-400 text-sm">{t("editor.noContent")}</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg ${className}`}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
});
