/**
 * Client-side index loader for professions
 *
 * This module handles loading the thin index for autocomplete.
 * It fetches from /data/professions.index.json and caches in memory.
 * Optionally integrates with IndexedDB for offline support.
 */

import type { ThinIndex, IndexItem } from "./indexSchema";
export type { IndexItem } from "./indexSchema";

// In-memory cache
let cachedIndex: ThinIndex | null = null;
let fetchPromise: Promise<ThinIndex> | null = null;

// IndexedDB key for caching
const IDB_KEY = "replacedbyai:professions-index";

/**
 * Load the thin index from network or cache
 * Returns cached version if available, otherwise fetches fresh
 */
export async function loadIndex(): Promise<ThinIndex> {
  // Return cached if available
  if (cachedIndex) {
    return cachedIndex;
  }

  // Dedupe concurrent requests
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = fetchIndex();
  cachedIndex = await fetchPromise;
  fetchPromise = null;

  return cachedIndex;
}

/**
 * Fetch the index from the network
 */
async function fetchIndex(): Promise<ThinIndex> {
  // Try to load from IndexedDB first (for offline)
  const cached = await loadFromIDB();
  if (cached) {
    // Return cached but refresh in background
    refreshInBackground();
    return cached;
  }

  // Fetch from network
  const response = await fetch("/data/professions.index.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch professions index: ${response.status}`);
  }

  const data = (await response.json()) as ThinIndex;

  // Cache to IndexedDB for offline use
  await saveToIDB(data);

  return data;
}

/**
 * Refresh the index in the background
 */
async function refreshInBackground(): Promise<void> {
  try {
    const response = await fetch("/data/professions.index.json");
    if (response.ok) {
      const data = (await response.json()) as ThinIndex;
      cachedIndex = data;
      await saveToIDB(data);
    }
  } catch {
    // Silently fail background refresh
  }
}

/**
 * Load index from IndexedDB
 */
async function loadFromIDB(): Promise<ThinIndex | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  try {
    const { getJSON } = await import("@miniapps/storage");
    return await getJSON<ThinIndex>(IDB_KEY);
  } catch {
    return null;
  }
}

/**
 * Save index to IndexedDB
 */
async function saveToIDB(data: ThinIndex): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  try {
    const { setJSON } = await import("@miniapps/storage");
    await setJSON(IDB_KEY, data);
  } catch {
    // Silently fail
  }
}

/**
 * Normalize text for search matching
 * - lowercase
 * - remove diacritics
 * - trim whitespace
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Search the index for matching professions
 * Matches against name and synonyms for the given locale
 */
export function searchIndex(
  index: ThinIndex,
  query: string,
  locale: "en" | "es",
  limit = 8
): IndexItem[] {
  const normalizedQuery = normalizeForSearch(query);

  if (!normalizedQuery) {
    return [];
  }

  const results: Array<{ item: IndexItem; score: number }> = [];

  for (const item of index.items) {
    let score = 0;

    // Check name match
    const normalizedName = normalizeForSearch(item.name[locale]);
    if (normalizedName.startsWith(normalizedQuery)) {
      score = 100; // Exact prefix match on name
    } else if (normalizedName.includes(normalizedQuery)) {
      score = 80; // Partial name match
    }

    // Check synonym matches
    for (const synonym of item.synonyms[locale]) {
      const normalizedSynonym = normalizeForSearch(synonym);
      if (normalizedSynonym.startsWith(normalizedQuery)) {
        score = Math.max(score, 90); // Prefix match on synonym
      } else if (normalizedSynonym.includes(normalizedQuery)) {
        score = Math.max(score, 70); // Partial synonym match
      }
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  // Sort by score (descending), then by name
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.name[locale].localeCompare(b.item.name[locale]);
  });

  return results.slice(0, limit).map((r) => r.item);
}

/**
 * Get all items from the index
 */
export async function getAllItems(): Promise<IndexItem[]> {
  const index = await loadIndex();
  return index.items;
}

/**
 * Preload the index (call early to warm cache)
 */
export function preloadIndex(): void {
  if (typeof window === "undefined") return;

  // Fire and forget
  loadIndex().catch(() => {
    // Silently fail
  });
}

