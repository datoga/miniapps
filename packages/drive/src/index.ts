// Types
export type {
  DriveConfig,
  DriveError,
  DriveFileInfo,
  DriveResult,
  DriveSyncStatus,
  GISTokenResponse,
  GoogleProfile,
} from "./types";

// GIS (Google Identity Services)
export {
  clearAuth,
  fetchUserProfile,
  getAccessToken,
  getProfile,
  isGoogleConfigured,
  loadGIS,
  requestAccessToken,
  signInWithGoogle,
} from "./gis";

// Drive Client
export {
  createFileMultipart,
  deleteFile,
  downloadFile,
  findFileByName,
  updateFileMedia,
  uploadData,
} from "./driveClient";

// UI Components
export { SyncStatusIndicator, type SyncStatusIndicatorProps } from "./SyncStatusIndicator";
