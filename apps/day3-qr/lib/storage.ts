import { local } from "@miniapps/storage";
import { v4 as uuidv4 } from "uuid";
import type { QrItem, QrPrefs } from "./types";
import { DEFAULT_PREFS, DEFAULT_QR_OPTIONS } from "./types";

// Storage keys with namespacing and versioning
const LIBRARY_KEY = "qrkit_way_library_v1";
const PREFS_KEY = "qrkit_way_prefs_v1";

/**
 * Load the QR library from localStorage
 */
export function loadLibrary(): QrItem[] {
  try {
    const data = local.getJSON<QrItem[]>(LIBRARY_KEY);
    if (!data || !Array.isArray(data)) {
      return [];
    }
    // Validate and filter out any corrupted items
    return data.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.data === "string"
    );
  } catch {
    // If corrupt, return empty array (will overwrite on next save)
    return [];
  }
}

/**
 * Save the entire QR library to localStorage
 */
export function saveLibrary(items: QrItem[]): void {
  local.setJSON(LIBRARY_KEY, items);
}

/**
 * Create a new QR item
 */
export function createItem(
  name: string,
  data: string,
  kind: QrItem["kind"],
  options?: Partial<QrItem["options"]>
): QrItem {
  return {
    id: uuidv4(),
    name: name.trim(),
    data,
    kind,
    createdAt: new Date().toISOString(),
    options: {
      ...DEFAULT_QR_OPTIONS,
      ...options,
    },
  };
}

/**
 * Upsert (add or update) an item in the library
 */
export function upsertItem(item: QrItem): QrItem[] {
  const items = loadLibrary();
  const index = items.findIndex((i) => i.id === item.id);

  if (index >= 0) {
    items[index] = item;
  } else {
    items.unshift(item); // Add to beginning (most recent first)
  }

  saveLibrary(items);
  return items;
}

/**
 * Delete an item from the library
 */
export function deleteItem(id: string): QrItem[] {
  const items = loadLibrary().filter((i) => i.id !== id);
  saveLibrary(items);
  return items;
}

/**
 * Toggle archive status of an item
 * If archivedAt exists, remove it; else set to current time
 */
export function toggleArchive(id: string): QrItem[] {
  const items = loadLibrary();
  const item = items.find((i) => i.id === id);

  if (item) {
    if (item.archivedAt) {
      delete item.archivedAt;
    } else {
      item.archivedAt = new Date().toISOString();
    }
    saveLibrary(items);
  }

  return items;
}

/**
 * Update the name of an item
 */
export function updateName(id: string, name: string): QrItem[] {
  const items = loadLibrary();
  const item = items.find((i) => i.id === id);

  if (item) {
    item.name = name.trim();
    saveLibrary(items);
  }

  return items;
}

/**
 * Update the options of an item
 */
export function updateItemOptions(
  id: string,
  options: Partial<QrItem["options"]>
): QrItem[] {
  const items = loadLibrary();
  const item = items.find((i) => i.id === id);

  if (item) {
    item.options = { ...item.options, ...options };
    saveLibrary(items);
  }

  return items;
}

/**
 * Load user preferences
 */
export function loadPrefs(): QrPrefs {
  try {
    const data = local.getJSON<QrPrefs>(PREFS_KEY);
    if (!data || typeof data !== "object") {
      return DEFAULT_PREFS;
    }
    return { ...DEFAULT_PREFS, ...data };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Save user preferences
 */
export function savePrefs(prefs: QrPrefs): void {
  local.setJSON(PREFS_KEY, prefs);
}

/**
 * Update a single preference
 */
export function updatePref<K extends keyof QrPrefs>(
  key: K,
  value: QrPrefs[K]
): QrPrefs {
  const prefs = loadPrefs();
  prefs[key] = value;
  savePrefs(prefs);
  return prefs;
}

