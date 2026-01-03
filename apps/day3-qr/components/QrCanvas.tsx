"use client";

import { memo, useEffect, useRef } from "react";
import type { QrOptions } from "../lib/types";
import { DEFAULT_QR_OPTIONS } from "../lib/types";
import { renderToCanvas } from "../lib/qrGenerator";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Render QR code to canvas
    renderToCanvas(canvas, data, opts).catch(console.error);
  }, [data, opts.sizePx, opts.ecc, opts.margin, opts.colorDark, opts.colorLight]);

  if (!data) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ width: opts.sizePx, height: opts.sizePx }}
      >
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          No content
        </span>
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

