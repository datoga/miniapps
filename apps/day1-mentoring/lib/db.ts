import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { Mentee, Session, Settings } from "./schemas";

const DB_NAME = "miniapps_day1_mentoring";
const DB_VERSION = 1;

// Define the database schema
interface MentoringDB extends DBSchema {
  settings: {
    key: string;
    value: Partial<Settings>;
  };
  mentees: {
    key: string;
    value: Mentee;
    indexes: { byArchived: "archived" };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: { byMenteeId: "menteeId" };
  };
}

let dbPromise: Promise<IDBPDatabase<MentoringDB>> | null = null;

/**
 * Initialize or get the IndexedDB database for Day1 Mentoring
 */
export async function getDB(): Promise<IDBPDatabase<MentoringDB>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }

  if (!dbPromise) {
    dbPromise = openDB<MentoringDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }

        // Mentees store with index on archived
        if (!db.objectStoreNames.contains("mentees")) {
          const menteeStore = db.createObjectStore("mentees", { keyPath: "id" });
          menteeStore.createIndex("byArchived", "archived");
        }

        // Sessions store with index on menteeId
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
          sessionStore.createIndex("byMenteeId", "menteeId");
        }
      },
    });
  }

  return dbPromise;
}

