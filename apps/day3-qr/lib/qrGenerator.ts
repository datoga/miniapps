"use client";

import QRCode from "qrcode";
import type { QrOptions } from "./types";
import { DEFAULT_QR_OPTIONS } from "./types";

/**
 * Generate QR code to canvas element
 */
export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  data: string,
  options: Partial<QrOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  await QRCode.toCanvas(canvas, data || " ", {
    width: opts.sizePx,
    margin: opts.margin,
    errorCorrectionLevel: opts.ecc,
    color: {
      dark: opts.colorDark,
      light: opts.colorLight,
    },
  });
}

/**
 * Generate QR code as data URL (for thumbnails)
 */
export async function toDataURL(
  data: string,
  size: number = 128,
  options: Partial<QrOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  try {
    return await QRCode.toDataURL(data || " ", {
      width: size,
      margin: Math.max(1, Math.floor(opts.margin / 2)),
      errorCorrectionLevel: opts.ecc,
      color: {
        dark: opts.colorDark,
        light: opts.colorLight,
      },
    });
  } catch {
    // Return a placeholder on error
    return "";
  }
}

/**
 * Generate QR code as SVG string
 */
export async function toSVGString(
  data: string,
  options: Partial<QrOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  return await QRCode.toString(data || " ", {
    type: "svg",
    margin: opts.margin,
    errorCorrectionLevel: opts.ecc,
    color: {
      dark: opts.colorDark,
      light: opts.colorLight,
    },
  });
}

/**
 * Download QR code as PNG
 */
export async function downloadPNG(
  data: string,
  filename: string,
  options: Partial<QrOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  const dataUrl = await QRCode.toDataURL(data || " ", {
    width: opts.sizePx,
    margin: opts.margin,
    errorCorrectionLevel: opts.ecc,
    color: {
      dark: opts.colorDark,
      light: opts.colorLight,
    },
  });

  // Create download link
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download QR code as SVG
 */
export async function downloadSVG(
  data: string,
  filename: string,
  options: Partial<QrOptions> = {}
): Promise<void> {
  const svg = await toSVGString(data, options);

  // Create blob and download
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = `${filename}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get QR code as PNG blob (for sharing)
 */
export async function toPNGBlob(
  data: string,
  options: Partial<QrOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  const dataUrl = await QRCode.toDataURL(data || " ", {
    width: opts.sizePx,
    margin: opts.margin,
    errorCorrectionLevel: opts.ecc,
    color: {
      dark: opts.colorDark,
      light: opts.colorLight,
    },
  });

  // Convert data URL to blob
  const response = await fetch(dataUrl);
  return await response.blob();
}

/**
 * Copy QR content to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

