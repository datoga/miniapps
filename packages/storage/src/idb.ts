import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "miniapps-storage";
const STORE_NAME = "keyval";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Initialize or get the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }

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
 * Get a JSON value from IndexedDB
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const db = await initDB();
    const value = await db.get(STORE_NAME, key);
    return value ?? null;
  } catch {
    return null;
  }
}

/**
 * Set a JSON value in IndexedDB
 */
export async function setJSON<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const db = await initDB();
    await db.put(STORE_NAME, value, key);
  } catch {
    // Silently fail
  }
}

/**
 * Remove a value from IndexedDB
 */
export async function remove(key: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const db = await initDB();
    await db.delete(STORE_NAME, key);
  } catch {
    // Silently fail
  }
}

