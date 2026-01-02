import { v4 as uuidv4 } from "uuid";
import { getDB } from "../db";
import type { Session, SessionFormInput } from "../schemas";

/**
 * List all sessions
 */
export async function listAllSessions(): Promise<Session[]> {
  const db = await getDB();
  return db.getAll("sessions");
}

/**
 * List sessions for a specific mentee (internal use)
 */
async function listSessionsByMentee(menteeId: string): Promise<Session[]> {
  const db = await getDB();
  const all = await db.getAll("sessions");
  return all.filter((s) => s.menteeId === menteeId);
}

/**
 * Create a new session
 */
export async function createSession(menteeId: string, input: SessionFormInput): Promise<Session> {
  const db = await getDB();
  const now = new Date().toISOString();

  const session: Session = {
    id: uuidv4(),
    menteeId,
    date: input.date,
    title: input.title,
    notes: input.notes,
    nextSteps: input.nextSteps ?? [],
    tags: input.tags ?? [],
    isRemote: input.isRemote ?? true,
    createdAt: now,
    updatedAt: now,
  };

  await db.put("sessions", session);
  return session;
}

/**
 * Update an existing session
 */
export async function updateSession(id: string, input: Partial<SessionFormInput>): Promise<Session | null> {
  const db = await getDB();
  const existing = await db.get("sessions", id);

  if (!existing) {
    return null;
  }

  const updated: Session = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await db.put("sessions", updated);
  return updated;
}

/**
 * Delete a session
 */
export async function deleteSession(id: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get("sessions", id);

  if (!existing) {
    return false;
  }

  await db.delete("sessions", id);
  return true;
}

/**
 * Delete all sessions for a mentee (cascade delete)
 */
export async function deleteSessionsByMentee(menteeId: string): Promise<number> {
  const db = await getDB();
  const sessions = await listSessionsByMentee(menteeId);

  const tx = db.transaction("sessions", "readwrite");

  for (const session of sessions) {
    await tx.store.delete(session.id);
  }

  await tx.done;
  return sessions.length;
}

/**
 * Replace all sessions (for backup import)
 */
export async function replaceAllSessions(sessions: Session[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("sessions", "readwrite");

  // Clear all
  await tx.store.clear();

  // Add all
  for (const session of sessions) {
    await tx.store.put(session);
  }

  await tx.done;
}

/**
 * Helper: Get today's date as YYYY-MM-DD
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0] as string;
}
