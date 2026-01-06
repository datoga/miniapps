"use client";

/**
 * Check if the browser supports all required APIs for the recorder
 *
 * Required:
 * - window.showDirectoryPicker (File System Access API)
 * - MediaRecorder
 * - navigator.mediaDevices.getUserMedia
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  // Check File System Access API
  if (typeof window !== "undefined") {
    if (!("showDirectoryPicker" in window)) {
      missing.push("File System Access API (showDirectoryPicker)");
    }
  } else {
    // SSR - assume supported, will re-check on client
    return { supported: true, missing: [] };
  }

  // Check MediaRecorder
  if (typeof MediaRecorder === "undefined") {
    missing.push("MediaRecorder API");
  }

  // Check getUserMedia
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    missing.push("getUserMedia API");
  }

  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Get the best supported MIME type for recording
 * @param preferMp4 - Whether to prefer MP4 format
 * @returns Object with mimeType and whether it matches preference
 */
export function getBestMimeType(preferMp4: boolean): {
  mimeType: string;
  format: "webm" | "mp4";
  matchesPreference: boolean;
} {
  // MP4 MIME types to try
  const mp4Types = [
    "video/mp4",
    "video/mp4;codecs=avc1",
    "video/mp4;codecs=h264",
  ];

  // WebM MIME types to try
  const webmTypes = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  const checkTypes = (types: string[]): string | null => {
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  };

  if (preferMp4) {
    const mp4 = checkTypes(mp4Types);
    if (mp4) {
      return { mimeType: mp4, format: "mp4", matchesPreference: true };
    }
    // Fall back to WebM
    const webm = checkTypes(webmTypes);
    if (webm) {
      return { mimeType: webm, format: "webm", matchesPreference: false };
    }
  } else {
    const webm = checkTypes(webmTypes);
    if (webm) {
      return { mimeType: webm, format: "webm", matchesPreference: true };
    }
    // Fall back to MP4
    const mp4 = checkTypes(mp4Types);
    if (mp4) {
      return { mimeType: mp4, format: "mp4", matchesPreference: false };
    }
  }

  // Ultimate fallback
  return { mimeType: "video/webm", format: "webm", matchesPreference: !preferMp4 };
}

/**
 * Generate a filename for the recording
 * @param format - File format (webm or mp4)
 * @param qualityPreset - Quality preset name
 * @returns Filename with timestamp and quality
 */
export function generateFilename(format: "webm" | "mp4", qualityPreset: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `recordme-${year}${month}${day}-${hours}${minutes}${seconds}-${qualityPreset}.${format}`;
}

/**
 * Create a file in a directory, handling collisions with suffixes
 * @param dirHandle - Directory handle
 * @param filename - Base filename
 * @returns Object with file handle and final filename
 */
export async function createUniqueFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<{ fileHandle: FileSystemFileHandle; finalFilename: string }> {
  const ext = filename.substring(filename.lastIndexOf("."));
  const base = filename.substring(0, filename.lastIndexOf("."));

  let suffix = 0;
  let finalFilename = filename;

  // Check if file exists and find unique name
  while (true) {
    try {
      // Try to get the file WITHOUT creating it - throws if doesn't exist
      await dirHandle.getFileHandle(finalFilename, { create: false });
      // File exists, try next suffix
      suffix++;
      finalFilename = `${base}-${suffix}${ext}`;
    } catch {
      // File doesn't exist - we can use this name
      break;
    }
  }

  // Now create the file with the unique name
  const fileHandle = await dirHandle.getFileHandle(finalFilename, { create: true });
  return { fileHandle, finalFilename };
}

