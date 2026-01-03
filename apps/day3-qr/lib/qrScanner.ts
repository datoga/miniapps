"use client";

import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

let reader: BrowserMultiFormatReader | null = null;

/**
 * Get or create a QR code reader instance
 */
function getReader(): BrowserMultiFormatReader {
  if (!reader) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    reader = new BrowserMultiFormatReader(hints);
  }
  return reader;
}

/**
 * Decode QR code from an image element
 */
export async function decodeFromImage(
  image: HTMLImageElement
): Promise<string | null> {
  try {
    const qrReader = getReader();
    const result = await qrReader.decodeFromImageElement(image);
    return result?.getText() || null;
  } catch {
    return null;
  }
}

/**
 * Decode QR code from a canvas element
 */
export async function decodeFromCanvas(
  canvas: HTMLCanvasElement
): Promise<string | null> {
  try {
    const qrReader = getReader();
    const result = await qrReader.decodeFromCanvas(canvas);
    return result?.getText() || null;
  } catch {
    return null;
  }
}

/**
 * Decode QR code from a blob/file
 */
export async function decodeFromBlob(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = async () => {
      const result = await decodeFromImage(img);
      URL.revokeObjectURL(url);
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Decode QR code from a URL
 */
export async function decodeFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const qrReader = getReader();
    const result = await qrReader.decodeFromImageUrl(imageUrl);
    return result?.getText() || null;
  } catch {
    return null;
  }
}

/**
 * Get available video input devices
 */
export async function getVideoDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch {
    return [];
  }
}

/**
 * Camera scanning state
 */
export interface CameraScanState {
  isScanning: boolean;
  deviceId: string | null;
  error: string | null;
}

/**
 * Start camera scanning for QR codes
 * Returns a cleanup function
 */
export function startCameraScanning(
  videoElement: HTMLVideoElement,
  deviceId: string | undefined,
  onResult: (result: string) => void,
  onError: (error: Error) => void
): () => void {
  const qrReader = getReader();
  let stopped = false;

  const decodeOnce = async () => {
    if (stopped) return;

    try {
      await qrReader.decodeFromVideoDevice(
        deviceId || undefined,
        videoElement,
        (result, error) => {
          if (stopped) return;

          if (result) {
            const text = result.getText();
            if (text) {
              stopped = true;
              onResult(text);
            }
          }

          if (error && !(error instanceof Error && error.message.includes("No MultiFormat"))) {
            // Ignore "no code found" errors during continuous scanning
          }
        }
      );
    } catch (err) {
      if (!stopped) {
        onError(err instanceof Error ? err : new Error("Camera error"));
      }
    }
  };

  decodeOnce();

  return () => {
    stopped = true;
    qrReader.reset();
  };
}

/**
 * Stop camera scanning
 */
export function stopCameraScanning(): void {
  if (reader) {
    reader.reset();
  }
}

/**
 * Reset reader instance (call when unmounting)
 */
export function resetReader(): void {
  if (reader) {
    reader.reset();
    reader = null;
  }
}

