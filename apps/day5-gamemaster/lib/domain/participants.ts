import { v4 as uuidv4 } from "uuid";
import * as db from "../db";
import type { Participant, ParticipantType, TeamMember } from "../schemas";

export interface CreateParticipantInput {
  name: string;
  type: ParticipantType;
  members?: TeamMember[];
}

/**
 * Create a new participant
 */
export async function createParticipant(input: CreateParticipantInput): Promise<Participant> {
  const now = Date.now();
  const participant: Participant = {
    id: uuidv4(),
    type: input.type,
    name: input.name,
    members: input.members,
    createdAt: now,
    updatedAt: now,
  };

  await db.saveParticipant(participant);
  return participant;
}

/**
 * Get a participant by ID
 */
export async function getParticipant(id: string): Promise<Participant | undefined> {
  return db.getParticipant(id);
}

/**
 * Get participants by IDs
 */
export async function getParticipantsByIds(ids: string[]): Promise<Participant[]> {
  return db.getParticipantsByIds(ids);
}

/**
 * Update a participant
 */
export async function updateParticipant(
  id: string,
  updates: Partial<Pick<Participant, "name" | "members">>
): Promise<Participant | null> {
  const participant = await db.getParticipant(id);
  if (!participant) {
    return null;
  }

  const updated: Participant = {
    ...participant,
    ...updates,
    updatedAt: Date.now(),
  };

  await db.saveParticipant(updated);
  return updated;
}

/**
 * Delete a participant
 */
export async function deleteParticipant(id: string): Promise<void> {
  await db.deleteParticipant(id);
}

/**
 * Get display name for a participant
 */
export function getParticipantDisplayName(participant: Participant): string {
  if (participant.type === "individual") {
    return participant.name;
  }

  if (participant.members && participant.members.length > 0) {
    return `${participant.name} (${participant.members.map((m) => m.name).join(", ")})`;
  }

  return participant.name;
}

