import { v4 as uuidv4 } from "uuid";
import { getDB } from "../db";
import type { Mentee, MenteeFormInput } from "../schemas";

/**
 * List all mentees
 */
export async function listMentees(): Promise<Mentee[]> {
  const db = await getDB();
  return db.getAll("mentees");
}

/**
 * List active (non-archived) mentees
 */
export async function listActiveMentees(): Promise<Mentee[]> {
  const all = await listMentees();
  return all.filter((m) => !m.archived);
}

/**
 * List archived mentees
 */
export async function listArchivedMentees(): Promise<Mentee[]> {
  const all = await listMentees();
  return all.filter((m) => m.archived);
}

/**
 * Get a single mentee by ID
 */
export async function getMentee(id: string): Promise<Mentee | undefined> {
  const db = await getDB();
  return db.get("mentees", id);
}

/**
 * Create a new mentee
 */
export async function createMentee(input: MenteeFormInput): Promise<Mentee> {
  const db = await getDB();
  const now = new Date().toISOString();

  const mentee: Mentee = {
    id: uuidv4(),
    name: input.name,
    age: typeof input.age === "number" ? input.age : undefined,
    inPersonAvailable: input.inPersonAvailable,
    inPersonNotes: input.inPersonNotes,
    goal: input.goal,
    notes: input.notes,
    tags: input.tags ?? [],
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.put("mentees", mentee);
  return mentee;
}

/**
 * Update an existing mentee
 */
export async function updateMentee(id: string, input: MenteeFormInput): Promise<Mentee | null> {
  const db = await getDB();
  const existing = await db.get("mentees", id);

  if (!existing) {
    return null;
  }

  const updated: Mentee = {
    ...existing,
    name: input.name,
    age: typeof input.age === "number" ? input.age : undefined,
    inPersonAvailable: input.inPersonAvailable,
    inPersonNotes: input.inPersonNotes,
    goal: input.goal,
    notes: input.notes,
    tags: input.tags ?? [],
    updatedAt: new Date().toISOString(),
  };

  await db.put("mentees", updated);
  return updated;
}

/**
 * Archive a mentee
 */
export async function archiveMentee(id: string): Promise<Mentee | null> {
  const db = await getDB();
  const existing = await db.get("mentees", id);

  if (!existing) {
    return null;
  }

  const updated: Mentee = {
    ...existing,
    archived: true,
    updatedAt: new Date().toISOString(),
  };

  await db.put("mentees", updated);
  return updated;
}

/**
 * Unarchive a mentee
 */
export async function unarchiveMentee(id: string): Promise<Mentee | null> {
  const db = await getDB();
  const existing = await db.get("mentees", id);

  if (!existing) {
    return null;
  }

  const updated: Mentee = {
    ...existing,
    archived: false,
    updatedAt: new Date().toISOString(),
  };

  await db.put("mentees", updated);
  return updated;
}

/**
 * Delete a mentee (hard delete)
 */
export async function deleteMentee(id: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get("mentees", id);

  if (!existing) {
    return false;
  }

  await db.delete("mentees", id);
  return true;
}

/**
 * Replace all mentees (for backup import)
 */
export async function replaceAllMentees(mentees: Mentee[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("mentees", "readwrite");

  // Clear all
  await tx.store.clear();

  // Add all
  for (const mentee of mentees) {
    await tx.store.put(mentee);
  }

  await tx.done;
}

