"use client";

import * as db from "./db";
import type { Backup, DriveProfile, DriveSyncState } from "./schemas";
import { BackupSchema } from "./schemas";
import { trackSettingsChanged } from "./ga";

// Google Drive API constants
const DRIVE_FILE_NAME = "bilbotracker-backup.json";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

// Get Google client ID from environment
const getClientId = () => process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] || "";

// Type for Google Identity Services
interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
}

interface GoogleUser {
  name?: string;
  email?: string;
  picture?: string;
}

// Store for current access token (in-memory only)
let currentAccessToken: string | null = null;

/**
 * Initialize Google Identity Services
 */
export async function initGoogleAuth(): Promise<boolean> {
  if (typeof window === "undefined") {return false;}

  const clientId = getClientId();
  if (!clientId) {
    console.warn("Google Client ID not configured");
    return false;
  }

  // Check if GIS is already loaded
  if ((window as unknown as { google?: unknown }).google) {
    return true;
  }

  // Load GIS script
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Sign in with Google and get access token
 */
export async function signInWithGoogle(): Promise<{ profile: DriveProfile; token: string } | null> {
  const initialized = await initGoogleAuth();
  if (!initialized) {return null;}

  const clientId = getClientId();
  if (!clientId) {return null;}

  return new Promise((resolve) => {
    const google = (window as unknown as { google: { accounts: { oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }) => { requestAccessToken: () => void };
    } } } }).google;

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: `${DRIVE_SCOPE} https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email`,
      callback: async (response: TokenResponse) => {
        if (response.error) {
          console.error("Token error:", response.error);
          resolve(null);
          return;
        }

        currentAccessToken = response.access_token;

        // Get user profile
        try {
          const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });
          const profile: GoogleUser = await profileRes.json();

          resolve({
            profile: {
              name: profile.name,
              email: profile.email,
              pictureUrl: profile.picture,
            },
            token: response.access_token,
          });
        } catch {
          resolve(null);
        }
      },
    });

    tokenClient.requestAccessToken();
  });
}

/**
 * Sign out and clear token
 */
export async function signOut(): Promise<void> {
  currentAccessToken = null;

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
async function findBackupFile(accessToken: string): Promise<{ id: string; modifiedTime: string } | null> {
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE_NAME}'&fields=files(id,modifiedTime)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {return null;}

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

  if (!res.ok) {return null;}

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
async function uploadBackup(accessToken: string, backup: Backup, existingFileId?: string): Promise<boolean> {
  const metadata = {
    name: DRIVE_FILE_NAME,
    mimeType: "application/json",
    ...(existingFileId ? {} : { parents: ["appDataFolder"] }),
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append(
    "file",
    new Blob([JSON.stringify(backup)], { type: "application/json" })
  );

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
 * Get current access token (for auto-sync after session save)
 */
export function getAccessToken(): string | null {
  return currentAccessToken;
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

