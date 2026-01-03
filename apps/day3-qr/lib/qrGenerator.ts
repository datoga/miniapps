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
 * Download QR code as JPG
 */
export async function downloadJPG(
  data: string,
  filename: string,
  options: Partial<QrOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  // Generate PNG data URL first
  const pngDataUrl = await QRCode.toDataURL(data || " ", {
    width: opts.sizePx,
    margin: opts.margin,
    errorCorrectionLevel: opts.ecc,
    color: {
      dark: opts.colorDark,
      light: opts.colorLight,
    },
  });

  // Convert to JPG using canvas
  const img = new Image();
  img.src = pngDataUrl;

  await new Promise<void>((resolve) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = opts.sizePx;
      canvas.height = opts.sizePx;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Fill with white background (JPG doesn't support transparency)
        ctx.fillStyle = opts.colorLight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.95);

        const link = document.createElement("a");
        link.download = `${filename}.jpg`;
        link.href = jpgDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      resolve();
    };
  });
}

/**
 * Download QR code as WebP
 */
export async function downloadWebP(
  data: string,
  filename: string,
  options: Partial<QrOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };

  // Generate PNG data URL first
  const pngDataUrl = await QRCode.toDataURL(data || " ", {
    width: opts.sizePx,
    margin: opts.margin,
    errorCorrectionLevel: opts.ecc,
    color: {
      dark: opts.colorDark,
      light: opts.colorLight,
    },
  });

  // Convert to WebP using canvas
  const img = new Image();
  img.src = pngDataUrl;

  await new Promise<void>((resolve) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = opts.sizePx;
      canvas.height = opts.sizePx;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);

        const webpDataUrl = canvas.toDataURL("image/webp", 0.95);

        const link = document.createElement("a");
        link.download = `${filename}.webp`;
        link.href = webpDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      resolve();
    };
  });
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
 * Get QR code as branded PNG blob (for sharing with footer)
 */
export async function toBrandedPNGBlob(
  data: string,
  options: Partial<QrOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_QR_OPTIONS, ...options };
  const qrSize = opts.sizePx;
  const footerHeight = 50;
  const padding = 20;
  const totalWidth = qrSize + padding * 2;
  const totalHeight = qrSize + footerHeight + padding * 2;

  // Generate QR as data URL
  const qrDataUrl = await QRCode.toDataURL(data || " ", {
    width: qrSize,
    margin: opts.margin,
    errorCorrectionLevel: opts.ecc,
    color: {
      dark: opts.colorDark,
      light: opts.colorLight,
    },
  });

  // Create canvas with footer
  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    // Fallback to non-branded
    const response = await fetch(qrDataUrl);
    return await response.blob();
  }

  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw QR code
  const qrImg = new Image();
  qrImg.src = qrDataUrl;

  await new Promise<void>((resolve) => {
    qrImg.onload = () => {
      ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);
      resolve();
    };
  });

  // Draw footer
  ctx.fillStyle = "#0ea5e9"; // sky-500
  ctx.fillRect(0, totalHeight - footerHeight, totalWidth, footerHeight);

  // Draw text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "🔷 Genera gratis tus QR en qrkit.pro",
    totalWidth / 2,
    totalHeight - footerHeight / 2
  );

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, "image/png");
  });
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

