"use client";

import * as db from "./db";
import {
  isGoogleConfigured,
  requestAccessToken,
  getAccessToken,
  clearAuth,
  fetchUserProfile,
  getProfile,
  findFileByName,
  downloadFile,
  updateFileMedia,
  createFileMultipart,
  type GoogleProfile,
} from "@miniapps/drive";
import type { WorkspaceSnapshot } from "./schemas";
import { WorkspaceSnapshotSchema } from "./schemas";

// Drive file name for this app
const DRIVE_FILE_NAME = "gamemaster.json";

// Sync status
export type SyncStatus = "disconnected" | "connected" | "syncing" | "needs_reconnect";

// Debounce timer for push
let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const PUSH_DEBOUNCE_MS = 3000;

// Sync status listeners
type SyncStatusListener = (status: SyncStatus) => void;
const syncStatusListeners = new Set<SyncStatusListener>();
let currentSyncStatus: SyncStatus = "disconnected";

/**
 * Subscribe to sync status changes
 */
export function subscribeToSyncStatus(listener: SyncStatusListener): () => void {
  syncStatusListeners.add(listener);
  // Immediately notify with current status
  listener(currentSyncStatus);
  return () => syncStatusListeners.delete(listener);
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

// Profile and last synced time cache
let cachedProfile: GoogleProfile | null = null;
let cachedLastSyncedAt: number | undefined = undefined;

/**
 * Get current sync profile
 */
export function getSyncProfile(): GoogleProfile | null {
  return cachedProfile || getProfile();
}

/**
 * Get last synced timestamp
 */
export function getLastSyncedAt(): number | undefined {
  return cachedLastSyncedAt;
}

/**
 * Update sync status and notify listeners
 */
function setSyncStatus(status: SyncStatus): void {
  currentSyncStatus = status;
  syncStatusListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (error) {
      console.error("Error in sync status listener:", error);
    }
  });
}

/**
 * Compute stable hash of snapshot for change detection
 */
async function computeSnapshotHash(snapshot: WorkspaceSnapshot): Promise<string> {
  // Stable stringify (sort keys)
  const stableJson = JSON.stringify(snapshot, Object.keys(snapshot).sort());

  // Use Web Crypto API for SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(stableJson);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Connect to Google Drive
 * Returns true if connected successfully
 */
export async function connectDrive(): Promise<boolean> {
  if (!isGoogleConfigured()) {
    console.warn("Google Client ID not configured");
    return false;
  }

  setSyncStatus("syncing");

  // Request token with consent prompt
  const token = await requestAccessToken("consent");
  if (!token) {
    setSyncStatus("disconnected");
    return false;
  }

  // Check if file exists
  const findResult = await findFileByName(token, DRIVE_FILE_NAME);
  if (!findResult.ok) {
    if (findResult.error.type === "unauthorized") {
      setSyncStatus("needs_reconnect");
    } else {
      setSyncStatus("disconnected");
    }
    return false;
  }

  // Fetch user profile
  cachedProfile = await fetchUserProfile(token);
  cachedLastSyncedAt = Date.now();

  // Save connection state
  await db.saveMeta({
    driveConnected: true,
    driveFileId: findResult.data?.id,
    lastDriveSyncAt: cachedLastSyncedAt,
  });

  // If file exists and local is empty, restore
  const isEmpty = await db.isLocalEmpty();
  if (findResult.data && isEmpty) {
    const downloadResult = await downloadFile<unknown>(token, findResult.data.id);
    if (downloadResult.ok) {
      const validation = WorkspaceSnapshotSchema.safeParse(downloadResult.data);
      if (validation.success) {
        await db.applyWorkspaceSnapshot(validation.data);
      }
    }
  } else if (!findResult.data) {
    // No file exists, push current state
    await pushToCloud(token);
  } else {
    // File exists and we have local data - last-write-wins, push local
    await pushToCloud(token);
  }

  setSyncStatus("connected");
  return true;
}

/**
 * Disconnect from Google Drive
 */
export async function disconnectDrive(): Promise<void> {
  clearAuth();
  cachedProfile = null;
  cachedLastSyncedAt = undefined;
  await db.saveMeta({
    driveConnected: false,
    driveFileId: undefined,
    lastDriveSyncAt: undefined,
    lastSnapshotHash: undefined,
  });
  setSyncStatus("disconnected");
}

/**
 * Push snapshot to cloud
 */
async function pushToCloud(token: string): Promise<boolean> {
  const meta = await db.getMeta();
  const snapshot = await db.getWorkspaceSnapshot();

  // Check if snapshot has changed
  const hash = await computeSnapshotHash(snapshot);
  if (hash === meta.lastSnapshotHash) {
    // No changes, skip push
    return true;
  }

  let success = false;

  if (meta.driveFileId) {
    // Update existing file
    const result = await updateFileMedia(token, meta.driveFileId, snapshot);
    success = result.ok;
  } else {
    // Create new file
    const result = await createFileMultipart(token, DRIVE_FILE_NAME, snapshot);
    if (result.ok) {
      await db.saveMeta({ driveFileId: result.data.id });
      success = true;
    }
  }

  if (success) {
    cachedLastSyncedAt = Date.now();
    await db.saveMeta({
      lastDriveSyncAt: cachedLastSyncedAt,
      lastSnapshotHash: hash,
    });
  }

  return success;
}

/**
 * Trigger push with debounce
 */
export function schedulePush(): void {
  if (pushDebounceTimer) {
    clearTimeout(pushDebounceTimer);
  }

  pushDebounceTimer = setTimeout(async () => {
    pushDebounceTimer = null;

    const meta = await db.getMeta();
    if (!meta.driveConnected) {
      return;
    }

    // Try to get token silently
    const token = getAccessToken() || await requestAccessToken("");
    if (!token) {
      // Token expired, needs reconnect
      setSyncStatus("needs_reconnect");
      return;
    }

    setSyncStatus("syncing");
    const success = await pushToCloud(token);
    setSyncStatus(success ? "connected" : "needs_reconnect");
  }, PUSH_DEBOUNCE_MS);
}

/**
 * Initialize sync on app load
 */
export async function initializeSync(): Promise<void> {
  const meta = await db.getMeta();

  if (!meta.driveConnected) {
    setSyncStatus("disconnected");
    return;
  }

  // Try to restore from cloud if local is empty
  const isEmpty = await db.isLocalEmpty();
  if (isEmpty) {
    // Try to get token silently
    const token = await requestAccessToken("");
    if (token) {
      setSyncStatus("syncing");

      // Find file
      const findResult = await findFileByName(token, DRIVE_FILE_NAME);
      if (findResult.ok && findResult.data) {
        // Download and restore
        const downloadResult = await downloadFile<unknown>(token, findResult.data.id);
        if (downloadResult.ok) {
          const validation = WorkspaceSnapshotSchema.safeParse(downloadResult.data);
          if (validation.success) {
            await db.applyWorkspaceSnapshot(validation.data);
            await db.saveMeta({
              driveFileId: findResult.data.id,
              lastDriveSyncAt: Date.now(),
            });
          }
        }
      }
      setSyncStatus("connected");
    } else {
      // Can't get token silently, needs reconnect
      setSyncStatus("needs_reconnect");
    }
  } else {
    // Have local data, just mark as connected (will push on next change)
    // Try to verify connection with silent token request
    const token = await requestAccessToken("");
    if (token) {
      setSyncStatus("connected");
    } else {
      setSyncStatus("needs_reconnect");
    }
  }
}

/**
 * Setup auto-push on database changes
 */
export function setupAutoPush(): () => void {
  return db.subscribeToDbChanges(() => {
    schedulePush();
  });
}

/**
 * Pull data from Drive (for TV mode polling)
 * Returns true if data was updated
 */
export async function pullFromDrive(): Promise<boolean> {
  const meta = await db.getMeta();

  if (!meta.driveConnected) {
    return false;
  }

  // Try to get token silently
  const token = getAccessToken() || await requestAccessToken("");
  if (!token) {
    setSyncStatus("needs_reconnect");
    return false;
  }

  // Find file
  const fileId = meta.driveFileId;
  if (!fileId) {
    // Try to find by name
    const findResult = await findFileByName(token, DRIVE_FILE_NAME);
    if (!findResult.ok || !findResult.data) {
      return false;
    }
    await db.saveMeta({ driveFileId: findResult.data.id });
    // Continue with found file
    return pullFromDrive();
  }

  // Download current state from Drive
  const downloadResult = await downloadFile<unknown>(token, fileId);
  if (!downloadResult.ok) {
    if (downloadResult.error.type === "unauthorized") {
      setSyncStatus("needs_reconnect");
    }
    return false;
  }

  // Validate snapshot
  const validation = WorkspaceSnapshotSchema.safeParse(downloadResult.data);
  if (!validation.success) {
    console.error("Invalid snapshot from Drive:", validation.error);
    return false;
  }

  const remoteSnapshot = validation.data;

  // Compute hash to check if different from local
  const remoteHash = await computeSnapshotHash(remoteSnapshot);

  if (remoteHash === meta.lastSnapshotHash) {
    // No changes
    return false;
  }

  // Apply remote snapshot
  await db.applyWorkspaceSnapshot(remoteSnapshot);
  cachedLastSyncedAt = Date.now();
  await db.saveMeta({
    lastDriveSyncAt: cachedLastSyncedAt,
    lastSnapshotHash: remoteHash,
  });

  setSyncStatus("connected");
  return true;
}
