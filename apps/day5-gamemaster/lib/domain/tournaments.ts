import { v4 as uuidv4 } from "uuid";
import * as db from "../db";
import type { Tournament, TournamentMode, ParticipantType, TournamentStatus, LadderType, GameConfig } from "../schemas";
import { trackTournamentCreated } from "../ga";

export interface CreateTournamentInput {
  name: string;
  mode: TournamentMode;
  participantType: ParticipantType;
  ladderType?: LadderType; // For ladder mode: "points" or "time"
  game?: GameConfig; // Game/activity configuration
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD), only if different from startDate
}

/**
 * Create a new tournament in draft status
 */
export async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  const now = Date.now();
  const tournament: Tournament = {
    id: uuidv4(),
    name: input.name,
    mode: input.mode,
    participantType: input.participantType,
    status: "draft",
    participantIds: [],
    settings: {
      ladderType: input.mode === "ladder" ? (input.ladderType || "points") : undefined,
    },
    nowPlaying: {},
    game: input.game,
    startDate: input.startDate,
    endDate: input.endDate && input.endDate !== input.startDate ? input.endDate : undefined,
    createdAt: now,
    updatedAt: now,
  };

  await db.saveTournament(tournament);

  // Track GA event
  trackTournamentCreated(tournament.mode, tournament.participantType);

  return tournament;
}

/**
 * Get all tournaments
 */
export async function listTournaments(): Promise<Tournament[]> {
  const tournaments = await db.getAllTournaments();
  // Sort by updatedAt descending (most recent first)
  return tournaments.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get a tournament by ID
 */
export async function getTournament(id: string): Promise<Tournament | undefined> {
  return db.getTournament(id);
}

/**
 * Add a participant to a tournament
 */
export async function addParticipantToTournament(
  tournamentId: string,
  participantId: string
): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament) {
    return null;
  }

  if (tournament.status !== "draft") {
    console.warn("Cannot add participants to a non-draft tournament");
    return null;
  }

  if (tournament.participantIds.includes(participantId)) {
    // Already added
    return tournament;
  }

  const updated: Tournament = {
    ...tournament,
    participantIds: [...tournament.participantIds, participantId],
    updatedAt: Date.now(),
  };

  await db.saveTournament(updated);
  return updated;
}

/**
 * Remove a participant from a tournament
 */
export async function removeParticipantFromTournament(
  tournamentId: string,
  participantId: string
): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament) {
    return null;
  }

  if (tournament.status !== "draft") {
    console.warn("Cannot remove participants from a non-draft tournament");
    return null;
  }

  const updated: Tournament = {
    ...tournament,
    participantIds: tournament.participantIds.filter((id) => id !== participantId),
    updatedAt: Date.now(),
  };

  await db.saveTournament(updated);
  return updated;
}

/**
 * Update tournament status
 */
export async function updateTournamentStatus(
  tournamentId: string,
  status: TournamentStatus
): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament) {
    return null;
  }

  const updated: Tournament = {
    ...tournament,
    status,
    updatedAt: Date.now(),
  };

  await db.saveTournament(updated);
  return updated;
}

/**
 * Update tournament now playing
 */
export async function updateNowPlaying(
  tournamentId: string,
  currentMatchId: string | undefined
): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament) {
    return null;
  }

  const updated: Tournament = {
    ...tournament,
    nowPlaying: { currentMatchId },
    updatedAt: Date.now(),
  };

  await db.saveTournament(updated);
  return updated;
}

/**
 * Update ladder order for tiebreaking
 */
export async function updateLadderOrder(
  tournamentId: string,
  ladderOrder: string[]
): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament) {
    return null;
  }

  const updated: Tournament = {
    ...tournament,
    ladderOrder,
    updatedAt: Date.now(),
  };

  await db.saveTournament(updated);
  return updated;
}

/**
 * Archive a tournament
 */
export async function archiveTournament(tournamentId: string): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament) {
    return null;
  }

  const updated: Tournament = {
    ...tournament,
    archived: true,
    updatedAt: Date.now(),
  };

  await db.saveTournament(updated);
  return updated;
}

/**
 * Unarchive a tournament
 */
export async function unarchiveTournament(tournamentId: string): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament) {
    return null;
  }

  const updated: Tournament = {
    ...tournament,
    archived: false,
    updatedAt: Date.now(),
  };

  await db.saveTournament(updated);
  return updated;
}

/**
 * Delete a tournament permanently
 */
export async function deleteTournament(tournamentId: string): Promise<void> {
  // Also delete all matches for this tournament
  const matches = await db.getMatchesForTournament(tournamentId);
  for (const match of matches) {
    await db.deleteMatch(match.id);
  }
  await db.deleteTournament(tournamentId);
}

/**
 * Revert an active tournament back to draft status
 * This allows editing participants before matches have been played
 */
export async function revertToDraft(tournamentId: string): Promise<Tournament | null> {
  const tournament = await db.getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") {
    return null;
  }

  // Delete all existing matches for this tournament
  const existingMatches = await db.getMatchesForTournament(tournamentId);
  for (const match of existingMatches) {
    await db.deleteMatch(match.id);
  }

  // Reset tournament to draft and clear bracket/doubleBracket structures
  const resetTournament: Tournament = {
    ...tournament,
    status: "draft",
    bracket: undefined,
    doubleBracket: undefined,
    ladderOrder: undefined,
    nowPlaying: {},
    updatedAt: Date.now(),
  };

  await db.saveTournament(resetTournament);
  return resetTournament;
}
