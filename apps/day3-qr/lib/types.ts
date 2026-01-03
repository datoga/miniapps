/**
 * QR Item data model
 */
export interface QrItem {
  id: string;
  name: string;
  data: string; // QR payload (URL or text) - NEVER send to GA
  kind: "url" | "text" | "other";
  createdAt: string; // ISO date
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
 * Sort options
 */
export type SortBy = "name" | "createdAt";
export type SortDir = "asc" | "desc";

/**
 * User preferences
 */
export interface QrPrefs {
  sortBy: SortBy;
  sortDir: SortDir;
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
  sortBy: "createdAt",
  sortDir: "desc",
};

/**
 * Editor mode type
 */
export type EditorMode = "create" | "scan" | "import";

/**
 * Content mode for creating QR
 */
export type ContentMode = "url" | "text";


