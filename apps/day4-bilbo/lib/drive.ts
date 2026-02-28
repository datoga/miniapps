"use client";

import {
  signInWithGoogle as driveSignIn,
  getAccessToken as driveGetAccessToken,
  requestAccessToken,
  clearAuth,
} from "@miniapps/drive";
import * as db from "./db";
import { trackSettingsChanged } from "./ga";
import type { Backup, DriveProfile, DriveSyncState } from "./schemas";
import { BackupSchema } from "./schemas";

// Google Drive API constants
const DRIVE_FILE_NAME = "bilbotracker-backup.json";

/**
 * Sign in with Google and get access token
 * Wraps @miniapps/drive's signInWithGoogle to match local DriveProfile type
 */
export async function signInWithGoogle(): Promise<{ profile: DriveProfile; token: string } | null> {
  const result = await driveSignIn();
  if (!result) return null;

  return {
    profile: {
      name: result.profile.name,
      email: result.profile.email,
      pictureUrl: result.profile.pictureUrl,
    },
    token: result.token,
  };
}

/**
 * Get current access token (from memory or localStorage via @miniapps/drive)
 */
export function getAccessToken(): string | null {
  return driveGetAccessToken();
}

/**
 * Ensure a valid access token is available.
 * Tries cached token first, then attempts silent refresh.
 * Returns null if user needs to sign in again.
 */
export async function ensureValidToken(): Promise<string | null> {
  // Try cached/localStorage token first
  const cached = driveGetAccessToken();
  if (cached) return cached;

  // Token expired or missing — try silent refresh (5s timeout)
  const refreshed = await requestAccessToken("");
  return refreshed;
}

/**
 * Sign out and clear token
 */
export async function signOut(): Promise<void> {
  // Clear token from memory and localStorage
  clearAuth();

  // Clear drive settings but keep other settings
  await db.saveSettings({
    driveSyncEnabled: false,
    driveSyncState: "signed_out",
    driveProfile: undefined,
    lastSyncedAt: undefined,
  });

  trackSettingsChanged("sync");
}

/**
 * Update sync state
 */
async function setSyncState(state: DriveSyncState): Promise<void> {
  await db.saveSettings({ driveSyncState: state });
}

/**
 * Find the backup file in appDataFolder
 */
async function findBackupFile(
  accessToken: string
): Promise<{ id: string; modifiedTime: string } | null> {
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE_NAME}'&fields=files(id,modifiedTime)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  return null;
}

/**
 * Download backup from Drive
 */
async function downloadBackup(accessToken: string, fileId: string): Promise<Backup | null> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return null;
  }

  try {
    const data = await res.json();
    const parsed = BackupSchema.safeParse(data);
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // Invalid JSON or schema
  }

  return null;
}

/**
 * Upload backup to Drive
 */
async function uploadBackup(
  accessToken: string,
  backup: Backup,
  existingFileId?: string
): Promise<boolean> {
  const metadata = {
    name: DRIVE_FILE_NAME,
    mimeType: "application/json",
    ...(existingFileId ? {} : { parents: ["appDataFolder"] }),
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([JSON.stringify(backup)], { type: "application/json" }));

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const res = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  return res.ok;
}

/**
 * Create a backup object from local data
 */
async function createBackup(): Promise<Backup> {
  const data = await db.exportData();

  return {
    schemaVersion: 1,
    appId: "bilbotracker",
    exportedAt: new Date().toISOString(),
    data: {
      settings: data.settings,
      exercises: data.exercises,
      cycles: data.cycles,
      sessions: data.sessions,
    },
  };
}

export interface ConflictInfo {
  localLastUpdated: number;
  remoteLastModified: string;
  localSessionCount: number;
  remoteSessionCount: number;
  localExerciseCount: number;
  remoteExerciseCount: number;
  localLastSession?: { date: string; loadKg: number; reps: number };
  remoteLastSession?: { date: string; loadKg: number; reps: number };
}

export interface FirstConnectionConflict {
  hasLocalData: boolean;
  hasRemoteData: boolean;
  localInfo: {
    exerciseCount: number;
    sessionCount: number;
    lastModified: number;
  };
  remoteInfo: {
    exerciseCount: number;
    sessionCount: number;
    lastModified: string;
  };
  remoteBackup: Backup;
}

/**
 * Check if there's a first connection conflict (local AND remote data exist)
 * Used when connecting to Google Drive for the first time
 */
export async function checkFirstConnectionConflict(
  accessToken: string
): Promise<FirstConnectionConflict | null> {
  try {
    // Get local data
    const localData = await db.exportData();
    const localExerciseCount = localData.exercises.length;
    const localSessionCount = localData.sessions.length;
    const localLastModified = await db.getMaxUpdatedAt();
    const hasLocalData = localExerciseCount > 0 || localSessionCount > 0;

    // Check for remote file
    const remoteFile = await findBackupFile(accessToken);

    if (!remoteFile) {
      // No remote data - no conflict
      return null;
    }

    // Download remote backup
    const remoteBackup = await downloadBackup(accessToken, remoteFile.id);
    if (!remoteBackup) {
      // Failed to download - no conflict (will handle as error)
      return null;
    }

    const remoteExerciseCount = remoteBackup.data.exercises.length;
    const remoteSessionCount = remoteBackup.data.sessions.length;
    const hasRemoteData = remoteExerciseCount > 0 || remoteSessionCount > 0;

    // Only conflict if BOTH have data
    if (!hasLocalData || !hasRemoteData) {
      return null;
    }

    return {
      hasLocalData,
      hasRemoteData,
      localInfo: {
        exerciseCount: localExerciseCount,
        sessionCount: localSessionCount,
        lastModified: localLastModified,
      },
      remoteInfo: {
        exerciseCount: remoteExerciseCount,
        sessionCount: remoteSessionCount,
        lastModified: remoteFile.modifiedTime,
      },
      remoteBackup,
    };
  } catch (error) {
    console.error("Error checking first connection conflict:", error);
    return null;
  }
}

/**
 * Perform sync operation
 * Returns conflict info if there's a conflict, null if sync completed
 */
export async function performSync(
  accessToken: string
): Promise<{ conflict: ConflictInfo; remoteBackup: Backup } | null> {
  await setSyncState("syncing");

  try {
    // Find remote file
    const remoteFile = await findBackupFile(accessToken);
    const localLastUpdated = await db.getMaxUpdatedAt();

    if (!remoteFile) {
      // No remote file - just upload
      const backup = await createBackup();
      const success = await uploadBackup(accessToken, backup);

      if (success) {
        await db.saveSettings({
          driveSyncState: "synced",
          lastSyncedAt: Date.now(),
        });
      } else {
        await setSyncState("error");
      }

      return null;
    }

    // Remote file exists - check for conflicts
    const remoteBackup = await downloadBackup(accessToken, remoteFile.id);
    if (!remoteBackup) {
      // Failed to download - treat as error
      await setSyncState("error");
      return null;
    }

    const remoteLastModified = new Date(remoteFile.modifiedTime).getTime();

    // Get local data for comparison
    const localData = await db.exportData();

    // Compare timestamps
    // If remote was modified after our last sync, we might have a conflict
    const settings = await db.getSettings();
    const lastSyncedAt = settings.lastSyncedAt || 0;

    // Simple conflict detection: if both have changed since last sync
    if (localLastUpdated > lastSyncedAt && remoteLastModified > lastSyncedAt) {
      // Conflict!
      const lastLocalSession = localData.sessions.sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      )[0];
      const lastRemoteSession = remoteBackup.data.sessions.sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      )[0];

      return {
        conflict: {
          localLastUpdated,
          remoteLastModified: remoteFile.modifiedTime,
          localSessionCount: localData.sessions.length,
          remoteSessionCount: remoteBackup.data.sessions.length,
          localExerciseCount: localData.exercises.length,
          remoteExerciseCount: remoteBackup.data.exercises.length,
          localLastSession: lastLocalSession
            ? {
                date: lastLocalSession.datetime,
                loadKg: lastLocalSession.loadUsedKg,
                reps: lastLocalSession.reps,
              }
            : undefined,
          remoteLastSession: lastRemoteSession
            ? {
                date: lastRemoteSession.datetime,
                loadKg: lastRemoteSession.loadUsedKg,
                reps: lastRemoteSession.reps,
              }
            : undefined,
        },
        remoteBackup,
      };
    }

    // No conflict - upload local
    const backup = await createBackup();
    const success = await uploadBackup(accessToken, backup, remoteFile.id);

    if (success) {
      await db.saveSettings({
        driveSyncState: "synced",
        lastSyncedAt: Date.now(),
      });
    } else {
      await setSyncState("error");
    }

    return null;
  } catch (error) {
    console.error("Sync error:", error);
    await setSyncState("error");
    return null;
  }
}

/**
 * Resolve conflict by keeping local data
 */
export async function resolveConflictKeepLocal(accessToken: string): Promise<boolean> {
  await setSyncState("syncing");

  try {
    const remoteFile = await findBackupFile(accessToken);
    const backup = await createBackup();
    const success = await uploadBackup(accessToken, backup, remoteFile?.id);

    if (success) {
      await db.saveSettings({
        driveSyncState: "synced",
        lastSyncedAt: Date.now(),
      });
      return true;
    }

    await setSyncState("error");
    return false;
  } catch {
    await setSyncState("error");
    return false;
  }
}

/**
 * Resolve conflict by keeping remote data
 */
export async function resolveConflictKeepRemote(remoteBackup: Backup): Promise<boolean> {
  await setSyncState("syncing");

  try {
    await db.importData({
      exercises: remoteBackup.data.exercises,
      cycles: remoteBackup.data.cycles,
      sessions: remoteBackup.data.sessions,
      settings: remoteBackup.data.settings,
    });

    await db.saveSettings({
      driveSyncState: "synced",
      lastSyncedAt: Date.now(),
    });

    return true;
  } catch {
    await setSyncState("error");
    return false;
  }
}

/**
 * Delete backup file from Google Drive
 */
export async function deleteBackupFromDrive(accessToken: string): Promise<boolean> {
  try {
    const remoteFile = await findBackupFile(accessToken);

    if (!remoteFile) {
      // No file to delete
      return true;
    }

    const url = `https://www.googleapis.com/drive/v3/files/${remoteFile.id}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok || res.status === 204) {
      // Clear last synced time since file is deleted
      await db.saveSettings({
        lastSyncedAt: undefined,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting backup from Drive:", error);
    return false;
  }
}
