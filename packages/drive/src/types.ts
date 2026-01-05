/**
 * Google user profile information
 */
export interface GoogleProfile {
  name?: string;
  email?: string;
  pictureUrl?: string;
}

/**
 * Sync status for Drive operations
 */
export type DriveSyncStatus =
  | "disconnected"
  | "connected"
  | "syncing"
  | "needs_reconnect"
  | "error";

/**
 * Drive file metadata
 */
export interface DriveFileInfo {
  id: string;
  modifiedTime: string;
}

/**
 * Result type for Drive operations
 */
export type DriveResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DriveError };

/**
 * Drive operation error
 */
export interface DriveError {
  type: "unauthorized" | "not_found" | "rate_limited" | "offline" | "unknown";
  message: string;
  status?: number;
}

/**
 * GIS Token response from Google Identity Services
 */
export interface GISTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
}

/**
 * Configuration for Drive operations
 */
export interface DriveConfig {
  fileName: string;
  clientId: string;
}

