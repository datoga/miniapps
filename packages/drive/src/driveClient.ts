"use client";

import type { DriveFileInfo, DriveResult, DriveError } from "./types";

const APP_DATA_FOLDER = "appDataFolder";

/**
 * Map HTTP errors to DriveError type
 */
function mapError(status: number, message?: string): DriveError {
  if (status === 401) {
    return { type: "unauthorized", message: message || "Unauthorized", status };
  }
  if (status === 404) {
    return { type: "not_found", message: message || "Not found", status };
  }
  if (status === 429) {
    return {
      type: "rate_limited",
      message: message || "Rate limited",
      status,
    };
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { type: "offline", message: "No internet connection" };
  }
  return { type: "unknown", message: message || "Unknown error", status };
}

/**
 * Find a file by name in appDataFolder
 */
export async function findFileByName(
  accessToken: string,
  fileName: string
): Promise<DriveResult<DriveFileInfo | null>> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files?spaces=${APP_DATA_FOLDER}&q=name='${fileName}'&fields=files(id,modifiedTime)`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return { ok: false, error: mapError(res.status, res.statusText) };
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return { ok: true, data: data.files[0] };
    }

    return { ok: true, data: null };
  } catch (error) {
    console.error("Error finding file:", error);
    return {
      ok: false,
      error: mapError(0, error instanceof Error ? error.message : "Unknown"),
    };
  }
}

/**
 * Download a file from Google Drive
 * Returns the raw JSON data - caller is responsible for parsing/validating
 */
export async function downloadFile<T = unknown>(
  accessToken: string,
  fileId: string
): Promise<DriveResult<T>> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return { ok: false, error: mapError(res.status, res.statusText) };
    }

    const data = await res.json();
    return { ok: true, data: data as T };
  } catch (error) {
    console.error("Error downloading file:", error);
    return {
      ok: false,
      error: mapError(0, error instanceof Error ? error.message : "Unknown"),
    };
  }
}

/**
 * Create a new file in appDataFolder using multipart upload
 */
export async function createFileMultipart<T>(
  accessToken: string,
  fileName: string,
  data: T
): Promise<DriveResult<DriveFileInfo>> {
  try {
    const metadata = {
      name: fileName,
      mimeType: "application/json",
      parents: [APP_DATA_FOLDER],
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append(
      "file",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );

    const url =
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime";

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (!res.ok) {
      return { ok: false, error: mapError(res.status, res.statusText) };
    }

    const result = await res.json();
    return {
      ok: true,
      data: { id: result.id, modifiedTime: result.modifiedTime },
    };
  } catch (error) {
    console.error("Error creating file:", error);
    return {
      ok: false,
      error: mapError(0, error instanceof Error ? error.message : "Unknown"),
    };
  }
}

/**
 * Update an existing file in Google Drive
 */
export async function updateFileMedia<T>(
  accessToken: string,
  fileId: string,
  data: T
): Promise<DriveResult<DriveFileInfo>> {
  try {
    const metadata = {
      mimeType: "application/json",
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append(
      "file",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );

    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,modifiedTime`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (!res.ok) {
      return { ok: false, error: mapError(res.status, res.statusText) };
    }

    const result = await res.json();
    return {
      ok: true,
      data: { id: result.id, modifiedTime: result.modifiedTime },
    };
  } catch (error) {
    console.error("Error updating file:", error);
    return {
      ok: false,
      error: mapError(0, error instanceof Error ? error.message : "Unknown"),
    };
  }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFile(
  accessToken: string,
  fileId: string
): Promise<DriveResult<void>> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 204) {
      return { ok: false, error: mapError(res.status, res.statusText) };
    }

    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      ok: false,
      error: mapError(0, error instanceof Error ? error.message : "Unknown"),
    };
  }
}

/**
 * Helper: Upload data to Drive (create or update)
 */
export async function uploadData<T>(
  accessToken: string,
  fileName: string,
  data: T,
  existingFileId?: string
): Promise<DriveResult<DriveFileInfo>> {
  if (existingFileId) {
    return updateFileMedia(accessToken, existingFileId, data);
  }
  return createFileMultipart(accessToken, fileName, data);
}
