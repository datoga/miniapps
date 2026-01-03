/**
 * QR Item data model
 */
export interface QrItem {
  id: string;
  name: string;
  data: string; // QR payload (URL or text) - NEVER send to GA
  kind: "url" | "text" | "other";
  createdAt: string; // ISO date
  archivedAt?: string; // ISO date (presence means archived)
  options: QrOptions;
}

/**
 * QR generation options
 */
export interface QrOptions {
  sizePx: number; // default 512
  ecc: "L" | "M" | "Q" | "H"; // error correction level, default "Q"
  margin: number; // default 2
  colorDark: string; // default "#111111"
  colorLight: string; // default "#FFFFFF"
}

/**
 * User preferences
 */
export interface QrPrefs {
  showArchived: boolean;
  lastOptions?: Partial<QrOptions>;
}

/**
 * Default QR options
 */
export const DEFAULT_QR_OPTIONS: QrOptions = {
  sizePx: 512,
  ecc: "Q",
  margin: 2,
  colorDark: "#111111",
  colorLight: "#FFFFFF",
};

/**
 * Default preferences
 */
export const DEFAULT_PREFS: QrPrefs = {
  showArchived: false,
};

/**
 * Editor mode type
 */
export type EditorMode = "create" | "read";

/**
 * Content mode for creating QR
 */
export type ContentMode = "url" | "text";

/**
 * Editor state for unsaved workspace
 */
export interface EditorState {
  mode: EditorMode;
  contentMode: ContentMode;
  name: string;
  data: string;
  options: QrOptions;
  isDirty: boolean;
  source?: "camera" | "upload" | "paste" | "url";
}

