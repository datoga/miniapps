"use client";

import { openDB, type IDBPDatabase } from "idb";

// ============ Types ============

export type QualityPreset = "low" | "standard" | "high" | "custom";
export type CameraDefault = "front" | "back"; // "user" / "environment" in MediaStream terms

export interface CustomQuality {
  width: number;
  height: number;
  fps: number;
  bitrateMbps: number;
}

export interface RecorderSettings {
  countdownSeconds: number; // 0, 3, 5, or 10
  qualityPreset: QualityPreset;
  customQuality: CustomQuality;
  preferMp4: boolean;
  micDefaultOn: boolean;
  cameraDefault: CameraDefault; // front (selfie) or back
}

export const DEFAULT_SETTINGS: RecorderSettings = {
  countdownSeconds: 3,
  qualityPreset: "standard",
  customQuality: {
    width: 1280,
    height: 720,
    fps: 30,
    bitrateMbps: 2.5,
  },
  preferMp4: true,
  micDefaultOn: false,
  cameraDefault: "front", // Default to selfie/front camera
};

// Quality presets
export const QUALITY_PRESETS: Record<Exclude<QualityPreset, "custom">, { width: number; height: number; fps: number; bitrateMbps: number }> = {
  low: { width: 854, height: 480, fps: 24, bitrateMbps: 1 },
  standard: { width: 1280, height: 720, fps: 30, bitrateMbps: 2.5 },
  high: { width: 1920, height: 1080, fps: 30, bitrateMbps: 5 },
};

export function getQualitySettings(settings: RecorderSettings): { width: number; height: number; fps: number; bitrateMbps: number } {
  if (settings.qualityPreset === "custom") {
    return settings.customQuality;
  }
  return QUALITY_PRESETS[settings.qualityPreset];
}

// ============ IndexedDB for Folder Handle ============

const DB_NAME = "recordme-storage";
const STORE_NAME = "settings";
const DB_VERSION = 1;
const FOLDER_HANDLE_KEY = "default-folder-handle";

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Store folder handle in IndexedDB
 */
export async function storeFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, handle, FOLDER_HANDLE_KEY);
}

/**
 * Get stored folder handle from IndexedDB
 */
export async function getFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await getDb();
    const handle = await db.get(STORE_NAME, FOLDER_HANDLE_KEY);
    return handle || null;
  } catch {
    return null;
  }
}

/**
 * Clear stored folder handle
 */
export async function clearFolderHandle(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, FOLDER_HANDLE_KEY);
}

/**
 * Verify folder handle still has permission
 * @returns true if we have permission, false otherwise
 */
export async function verifyFolderPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    // Cast to access non-standard API methods
    const handleWithPermissions = handle as FileSystemDirectoryHandle & {
      queryPermission(desc: { mode: string }): Promise<PermissionState>;
      requestPermission(desc: { mode: string }): Promise<PermissionState>;
    };

    // Check if we have readwrite permission
    const permission = await handleWithPermissions.queryPermission({ mode: "readwrite" });
    if (permission === "granted") {
      return true;
    }

    // Try to request permission
    const newPermission = await handleWithPermissions.requestPermission({ mode: "readwrite" });
    return newPermission === "granted";
  } catch {
    return false;
  }
}

/**
 * Pick a new directory
 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    // Access the non-standard showDirectoryPicker API
    const showDirectoryPicker = window["showDirectoryPicker"] as (
      options?: { mode?: string; startIn?: string }
    ) => Promise<FileSystemDirectoryHandle>;

    const handle = await showDirectoryPicker({
      mode: "readwrite",
      startIn: "videos",
    });
    await storeFolderHandle(handle);
    return handle;
  } catch (error) {
    // User cancelled or error
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

// ============ LocalStorage for Simple Settings ============

const SETTINGS_KEY = "recordme-settings";

/**
 * Load settings from localStorage
 */
export function loadSettings(): RecorderSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle missing properties
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        customQuality: {
          ...DEFAULT_SETTINGS.customQuality,
          ...(parsed.customQuality || {}),
        },
      };
    }
  } catch {
    // Ignore parse errors
  }

  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: RecorderSettings): void {
  if (typeof window === "undefined") {return;}

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

