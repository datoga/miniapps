import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { Tournament, Participant, Match, Meta } from "./schemas";
import { defaultMeta, WorkspaceSnapshotSchema } from "./schemas";

const DB_NAME = "tournament_manager";
const DB_VERSION = 1;

// Define the database schema
interface TournamentDB extends DBSchema {
  meta: {
    key: string;
    value: Meta;
  };
  tournaments: {
    key: string;
    value: Tournament;
    indexes: {
      byStatus: string;
    };
  };
  participants: {
    key: string;
    value: Participant;
  };
  matches: {
    key: string;
    value: Match;
    indexes: {
      byTournamentId: string;
      byStatus: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<TournamentDB>> | null = null;

// DB change listeners
type DbChangeListener = () => void;
const dbChangeListeners = new Set<DbChangeListener>();

/**
 * Subscribe to database changes
 */
export function subscribeToDbChanges(listener: DbChangeListener): () => void {
  dbChangeListeners.add(listener);
  return () => dbChangeListeners.delete(listener);
}

/**
 * Notify all listeners that the database has changed
 */
export function notifyDbChanged(): void {
  dbChangeListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Error in DB change listener:", error);
    }
  });
}

/**
 * Initialize or get the IndexedDB database
 */
export async function getDB(): Promise<IDBPDatabase<TournamentDB>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }

  if (!dbPromise) {
    dbPromise = openDB<TournamentDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Meta store (singleton)
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "id" });
        }

        // Tournaments store
        if (!db.objectStoreNames.contains("tournaments")) {
          const store = db.createObjectStore("tournaments", { keyPath: "id" });
          store.createIndex("byStatus", "status");
        }

        // Participants store
        if (!db.objectStoreNames.contains("participants")) {
          db.createObjectStore("participants", { keyPath: "id" });
        }

        // Matches store
        if (!db.objectStoreNames.contains("matches")) {
          const store = db.createObjectStore("matches", { keyPath: "id" });
          store.createIndex("byTournamentId", "tournamentId");
          store.createIndex("byStatus", "status");
        }
      },
    });
  }

  return dbPromise;
}

// ============ Meta Operations ============

export async function getMeta(): Promise<Meta> {
  const db = await getDB();
  const stored = await db.get("meta", "meta");
  return stored || defaultMeta;
}

export async function saveMeta(meta: Partial<Meta>): Promise<void> {
  const db = await getDB();
  const current = await getMeta();
  await db.put("meta", { ...current, ...meta, id: "meta" });
}

// ============ Tournament Operations ============

export async function getAllTournaments(): Promise<Tournament[]> {
  const db = await getDB();
  return db.getAll("tournaments");
}

export async function getTournament(id: string): Promise<Tournament | undefined> {
  const db = await getDB();
  return db.get("tournaments", id);
}

export async function saveTournament(tournament: Tournament): Promise<void> {
  const db = await getDB();
  await db.put("tournaments", tournament);
  notifyDbChanged();
}

export async function deleteTournament(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["tournaments", "matches"], "readwrite");

  // Delete all matches for this tournament
  const matches = await tx.objectStore("matches").index("byTournamentId").getAll(id);
  for (const match of matches) {
    await tx.objectStore("matches").delete(match.id);
  }

  // Delete the tournament
  await tx.objectStore("tournaments").delete(id);
  await tx.done;
  notifyDbChanged();
}

// ============ Participant Operations ============

export async function getAllParticipants(): Promise<Participant[]> {
  const db = await getDB();
  return db.getAll("participants");
}

export async function getParticipant(id: string): Promise<Participant | undefined> {
  const db = await getDB();
  return db.get("participants", id);
}

export async function getParticipantsByIds(ids: string[]): Promise<Participant[]> {
  const db = await getDB();
  const results: Participant[] = [];
  for (const id of ids) {
    const participant = await db.get("participants", id);
    if (participant) {
      results.push(participant);
    }
  }
  return results;
}

export async function saveParticipant(participant: Participant): Promise<void> {
  const db = await getDB();
  await db.put("participants", participant);
  notifyDbChanged();
}

export async function deleteParticipant(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("participants", id);
  notifyDbChanged();
}

// ============ Match Operations ============

export async function getAllMatches(): Promise<Match[]> {
  const db = await getDB();
  return db.getAll("matches");
}

export async function getMatchesForTournament(tournamentId: string): Promise<Match[]> {
  const db = await getDB();
  return db.getAllFromIndex("matches", "byTournamentId", tournamentId);
}

export async function getMatch(id: string): Promise<Match | undefined> {
  const db = await getDB();
  return db.get("matches", id);
}

export async function saveMatch(match: Match): Promise<void> {
  const db = await getDB();
  await db.put("matches", match);
  notifyDbChanged();
}

export async function deleteMatch(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("matches", id);
  notifyDbChanged();
}

// ============ Snapshot Operations (for Drive sync) ============

/**
 * Check if local database is empty (no tournaments)
 */
export async function isLocalEmpty(): Promise<boolean> {
  const tournaments = await getAllTournaments();
  return tournaments.length === 0;
}

/**
 * Get a complete snapshot of the workspace for backup
 */
export async function getWorkspaceSnapshot(): Promise<{
  schemaVersion: 1;
  appId: "gamemaster";
  updatedAt: number;
  tournaments: Tournament[];
  participants: Participant[];
  matches: Match[];
}> {
  const [tournaments, participants, matches] = await Promise.all([
    getAllTournaments(),
    getAllParticipants(),
    getAllMatches(),
  ]);

  return {
    schemaVersion: 1,
    appId: "gamemaster",
    updatedAt: Date.now(),
    tournaments,
    participants,
    matches,
  };
}

/**
 * Apply a workspace snapshot (clear and replace all data)
 */
export async function applyWorkspaceSnapshot(snapshot: unknown): Promise<boolean> {
  // Validate the snapshot
  const result = WorkspaceSnapshotSchema.safeParse(snapshot);
  if (!result.success) {
    console.error("Invalid snapshot schema:", result.error);
    return false;
  }

  const data = result.data;

  const db = await getDB();
  const tx = db.transaction(["tournaments", "participants", "matches"], "readwrite");

  try {
    // Clear existing data
    await tx.objectStore("tournaments").clear();
    await tx.objectStore("participants").clear();
    await tx.objectStore("matches").clear();

    // Import new data
    for (const tournament of data.tournaments) {
      await tx.objectStore("tournaments").put(tournament);
    }
    for (const participant of data.participants) {
      await tx.objectStore("participants").put(participant);
    }
    for (const match of data.matches) {
      await tx.objectStore("matches").put(match);
    }

    await tx.done;
    notifyDbChanged();
    return true;
  } catch (error) {
    console.error("Error applying snapshot:", error);
    return false;
  }
}

/**
 * Clear all data (for testing or reset)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["tournaments", "participants", "matches", "meta"], "readwrite");

  await tx.objectStore("tournaments").clear();
  await tx.objectStore("participants").clear();
  await tx.objectStore("matches").clear();
  await tx.objectStore("meta").clear();

  await tx.done;
  notifyDbChanged();
}

