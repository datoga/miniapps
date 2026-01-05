"use client";

/**
 * Database layer - Local storage only (no cloud sync)
 * Uses IndexedDB via @miniapps/storage for persistence
 */

import { getJSON, setJSON, remove } from "@miniapps/storage";
import type { Tournament, Participant, Match, WorkspaceSnapshot } from "./schemas";
import { WorkspaceSnapshotSchema } from "./schemas";

const STORAGE_KEY = "gamemaster-data";

// ============ In-Memory Cache ============

interface DataCache {
  tournaments: Map<string, Tournament>;
  participants: Map<string, Participant>;
  matches: Map<string, Match>;
  loaded: boolean;
}

const cache: DataCache = {
  tournaments: new Map(),
  participants: new Map(),
  matches: new Map(),
  loaded: false,
};

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

// ============ Load/Save to Storage ============

/**
 * Load data from IndexedDB into cache
 */
async function loadFromStorage(): Promise<void> {
  try {
    const data = await getJSON<WorkspaceSnapshot>(STORAGE_KEY);
    if (data) {
      cache.tournaments.clear();
      cache.participants.clear();
      cache.matches.clear();

      for (const t of data.tournaments || []) {
        cache.tournaments.set(t.id, t);
      }
      for (const p of data.participants || []) {
        cache.participants.set(p.id, p);
      }
      for (const m of data.matches || []) {
        cache.matches.set(m.id, m);
      }
    }
  } catch (error) {
    console.error("Error loading from storage:", error);
  }
  cache.loaded = true;
}

/**
 * Save cache to IndexedDB
 */
async function saveToStorage(): Promise<void> {
  const snapshot: WorkspaceSnapshot = {
    schemaVersion: 1,
    appId: "gamemaster",
    updatedAt: Date.now(),
    tournaments: Array.from(cache.tournaments.values()),
    participants: Array.from(cache.participants.values()),
    matches: Array.from(cache.matches.values()),
  };

  try {
    await setJSON(STORAGE_KEY, snapshot);
  } catch (error) {
    console.error("Error saving to storage:", error);
  }
}

// ============ Initialization ============

let initPromise: Promise<void> | null = null;

/**
 * Initialize the database - load data from storage
 */
export async function initializeDb(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = loadFromStorage();
  await initPromise;
  notifyDbChanged();
}

/**
 * Check if data is loaded
 */
export function isDataLoaded(): boolean {
  return cache.loaded;
}

// ============ Tournament Operations ============

export function getAllTournaments(): Tournament[] {
  return Array.from(cache.tournaments.values()).sort((a, b) => {
    // Sort by updatedAt descending (newest first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function getTournament(id: string): Tournament | undefined {
  return cache.tournaments.get(id);
}

export function saveTournament(tournament: Tournament): void {
  cache.tournaments.set(tournament.id, tournament);
  notifyDbChanged();
  saveToStorage();
}

export function deleteTournament(id: string): void {
  cache.tournaments.delete(id);
  notifyDbChanged();
  saveToStorage();
}

// ============ Participant Operations ============

export function getAllParticipants(): Participant[] {
  return Array.from(cache.participants.values());
}

export function getParticipant(id: string): Participant | undefined {
  return cache.participants.get(id);
}

export function getParticipantsByIds(ids: string[]): Participant[] {
  return ids.map((id) => cache.participants.get(id)).filter(Boolean) as Participant[];
}

export function saveParticipant(participant: Participant): void {
  cache.participants.set(participant.id, participant);
  notifyDbChanged();
  saveToStorage();
}

export function deleteParticipant(id: string): void {
  cache.participants.delete(id);
  notifyDbChanged();
  saveToStorage();
}

// ============ Match Operations ============

export function getAllMatches(): Match[] {
  return Array.from(cache.matches.values());
}

export function getMatchesForTournament(tournamentId: string): Match[] {
  return Array.from(cache.matches.values()).filter(
    (m) => m.tournamentId === tournamentId
  );
}

export function getMatch(id: string): Match | undefined {
  return cache.matches.get(id);
}

export function saveMatch(match: Match): void {
  cache.matches.set(match.id, match);
  notifyDbChanged();
  saveToStorage();
}

export function deleteMatch(id: string): void {
  cache.matches.delete(id);
  notifyDbChanged();
  saveToStorage();
}

// ============ Batch Operations ============

export function saveBatch(data: {
  tournaments?: Tournament[];
  participants?: Participant[];
  matches?: Match[];
}): void {
  if (data.tournaments) {
    for (const t of data.tournaments) {
      cache.tournaments.set(t.id, t);
    }
  }
  if (data.participants) {
    for (const p of data.participants) {
      cache.participants.set(p.id, p);
    }
  }
  if (data.matches) {
    for (const m of data.matches) {
      cache.matches.set(m.id, m);
    }
  }
  notifyDbChanged();
  saveToStorage();
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  cache.tournaments.clear();
  cache.participants.clear();
  cache.matches.clear();
  notifyDbChanged();

  try {
    await remove(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
}

// ============ Export/Import ============

/**
 * Export all data as a JSON object
 */
export function exportData(): WorkspaceSnapshot {
  return {
    schemaVersion: 1,
    appId: "gamemaster",
    updatedAt: Date.now(),
    tournaments: Array.from(cache.tournaments.values()),
    participants: Array.from(cache.participants.values()),
    matches: Array.from(cache.matches.values()),
  };
}

/**
 * Import data from a JSON object (replaces all existing data)
 */
export async function importData(data: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the data structure
    const parsed = WorkspaceSnapshotSchema.safeParse(data);

    if (!parsed.success) {
      return { success: false, error: "Invalid data format" };
    }

    const snapshot = parsed.data;

    // Clear existing data
    cache.tournaments.clear();
    cache.participants.clear();
    cache.matches.clear();

    // Load new data
    for (const t of snapshot.tournaments) {
      cache.tournaments.set(t.id, t);
    }
    for (const p of snapshot.participants) {
      cache.participants.set(p.id, p);
    }
    for (const m of snapshot.matches) {
      cache.matches.set(m.id, m);
    }

    // Save to storage
    await saveToStorage();
    notifyDbChanged();

    return { success: true };
  } catch (error) {
    console.error("Error importing data:", error);
    return { success: false, error: "Failed to import data" };
  }
}

// Type re-exports
export type { Tournament, Participant, Match, WorkspaceSnapshot } from "./schemas";
