import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { Exercise, Cycle, Session, UserSettings } from "./schemas";
import { defaultSettings } from "./schemas";

const DB_NAME = "bilbo_dashboard";
const DB_VERSION = 1;

// Define the database schema
interface BilboDB extends DBSchema {
  settings: {
    key: string;
    value: Partial<UserSettings>;
  };
  exercises: {
    key: string;
    value: Exercise;
  };
  cycles: {
    key: string;
    value: Cycle;
    indexes: {
      byExerciseId: string;
      byIsActive: number; // 0 or 1
    };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: {
      byExerciseId: string;
      byCycleId: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<BilboDB>> | null = null;

/**
 * Initialize or get the IndexedDB database
 */
export async function getDB(): Promise<IDBPDatabase<BilboDB>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }

  if (!dbPromise) {
    dbPromise = openDB<BilboDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }

        // Exercises store
        if (!db.objectStoreNames.contains("exercises")) {
          db.createObjectStore("exercises", { keyPath: "id" });
        }

        // Cycles store with indexes
        if (!db.objectStoreNames.contains("cycles")) {
          const cycleStore = db.createObjectStore("cycles", { keyPath: "id" });
          cycleStore.createIndex("byExerciseId", "exerciseId");
          cycleStore.createIndex("byIsActive", "isActive");
        }

        // Sessions store with indexes
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
          sessionStore.createIndex("byExerciseId", "exerciseId");
          sessionStore.createIndex("byCycleId", "cycleId");
        }
      },
    });
  }

  return dbPromise;
}

// ============ Settings ============

export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  const stored = await db.get("settings", "user");
  return { ...defaultSettings, ...stored };
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const db = await getDB();
  const current = await getSettings();
  await db.put("settings", { ...current, ...settings }, "user");
}

// ============ Exercises ============

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAll("exercises");
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  const db = await getDB();
  return db.get("exercises", id);
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  const db = await getDB();
  await db.put("exercises", exercise);
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDB();
  // Delete exercise and all related cycles and sessions
  const tx = db.transaction(["exercises", "cycles", "sessions"], "readwrite");

  // Delete sessions for this exercise
  const sessions = await tx.objectStore("sessions").index("byExerciseId").getAll(id);
  for (const session of sessions) {
    await tx.objectStore("sessions").delete(session.id);
  }

  // Delete cycles for this exercise
  const cycles = await tx.objectStore("cycles").index("byExerciseId").getAll(id);
  for (const cycle of cycles) {
    await tx.objectStore("cycles").delete(cycle.id);
  }

  // Delete the exercise itself
  await tx.objectStore("exercises").delete(id);

  await tx.done;
}

// ============ Cycles ============

export async function getCyclesForExercise(exerciseId: string): Promise<Cycle[]> {
  const db = await getDB();
  return db.getAllFromIndex("cycles", "byExerciseId", exerciseId);
}

export async function getActiveCycleForExercise(exerciseId: string): Promise<Cycle | undefined> {
  const cycles = await getCyclesForExercise(exerciseId);
  return cycles.find((c) => c.isActive);
}

export async function getCycle(id: string): Promise<Cycle | undefined> {
  const db = await getDB();
  return db.get("cycles", id);
}

export async function saveCycle(cycle: Cycle): Promise<void> {
  const db = await getDB();
  await db.put("cycles", cycle);
}

export async function deleteCycle(id: string): Promise<void> {
  const db = await getDB();
  // Delete cycle and all related sessions
  const tx = db.transaction(["cycles", "sessions"], "readwrite");

  const sessions = await tx.objectStore("sessions").index("byCycleId").getAll(id);
  for (const session of sessions) {
    await tx.objectStore("sessions").delete(session.id);
  }

  await tx.objectStore("cycles").delete(id);
  await tx.done;
}

// ============ Sessions ============

export async function getSessionsForExercise(exerciseId: string): Promise<Session[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex("sessions", "byExerciseId", exerciseId);
  // Sort by datetime descending, then by updatedAt descending (newest first)
  // Use string comparison for ISO datetime (works correctly for YYYY-MM-DDTHH:MM:SS format)
  return sessions.sort((a, b) => {
    const dateCompare = b.datetime.localeCompare(a.datetime);
    if (dateCompare !== 0) {return dateCompare;}
    // If same datetime, use updatedAt as tiebreaker
    return b.updatedAt - a.updatedAt;
  });
}

export async function getSessionsForCycle(cycleId: string): Promise<Session[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex("sessions", "byCycleId", cycleId);
  // Sort by datetime descending, then by updatedAt descending (newest first)
  // Use string comparison for ISO datetime (works correctly for YYYY-MM-DDTHH:MM:SS format)
  return sessions.sort((a, b) => {
    const dateCompare = b.datetime.localeCompare(a.datetime);
    if (dateCompare !== 0) {return dateCompare;}
    // If same datetime, use updatedAt as tiebreaker
    return b.updatedAt - a.updatedAt;
  });
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDB();
  return db.get("sessions", id);
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put("sessions", session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("sessions", id);
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDB();
  return db.getAll("sessions");
}

export async function getAllCycles(): Promise<Cycle[]> {
  const db = await getDB();
  return db.getAll("cycles");
}

// ============ Bulk operations for sync ============

export async function importData(data: {
  exercises: Exercise[];
  cycles: Cycle[];
  sessions: Session[];
  settings?: Partial<UserSettings>;
}): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["exercises", "cycles", "sessions", "settings"], "readwrite");

  // Clear existing data
  await tx.objectStore("exercises").clear();
  await tx.objectStore("cycles").clear();
  await tx.objectStore("sessions").clear();

  // Import new data
  for (const exercise of data.exercises) {
    await tx.objectStore("exercises").put(exercise);
  }
  for (const cycle of data.cycles) {
    await tx.objectStore("cycles").put(cycle);
  }
  for (const session of data.sessions) {
    await tx.objectStore("sessions").put(session);
  }

  // Merge settings (don't overwrite drive-related settings)
  if (data.settings) {
    const currentSettings = (await tx.objectStore("settings").get("user")) || {};
    await tx.objectStore("settings").put(
      {
        ...currentSettings,
        ...data.settings,
        // Preserve local drive settings
        driveSyncEnabled: currentSettings.driveSyncEnabled,
        driveSyncState: currentSettings.driveSyncState,
        driveProfile: currentSettings.driveProfile,
        lastSyncedAt: currentSettings.lastSyncedAt,
      },
      "user"
    );
  }

  await tx.done;
}

export async function exportData(): Promise<{
  exercises: Exercise[];
  cycles: Cycle[];
  sessions: Session[];
  settings: Partial<UserSettings>;
}> {
  const [exercises, cycles, sessions, settings] = await Promise.all([
    getAllExercises(),
    getAllCycles(),
    getAllSessions(),
    getSettings(),
  ]);

  // Exclude drive-related settings from export
  const { driveSyncState: _driveSyncState, driveProfile: _driveProfile, lastSyncedAt: _lastSyncedAt, ...exportSettings } = settings;

  return {
    exercises,
    cycles,
    sessions,
    settings: exportSettings,
  };
}

// Clear all data (exercises, cycles, sessions, and reset settings)
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["exercises", "cycles", "sessions", "settings"], "readwrite");

  await tx.objectStore("exercises").clear();
  await tx.objectStore("cycles").clear();
  await tx.objectStore("sessions").clear();
  await tx.objectStore("settings").clear();

  await tx.done;
}

// Get max updatedAt across all entities (for sync comparison)
export async function getMaxUpdatedAt(): Promise<number> {
  const [exercises, cycles, sessions] = await Promise.all([
    getAllExercises(),
    getAllCycles(),
    getAllSessions(),
  ]);

  let max = 0;
  for (const e of exercises) {
    if (e.updatedAt > max) {max = e.updatedAt;}
  }
  for (const c of cycles) {
    if (c.startedAt > max) {max = c.startedAt;}
    if (c.endedAt && c.endedAt > max) {max = c.endedAt;}
  }
  for (const s of sessions) {
    if (s.updatedAt > max) {max = s.updatedAt;}
  }

  return max;
}

