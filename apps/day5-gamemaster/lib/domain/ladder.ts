import { v4 as uuidv4 } from "uuid";
import * as db from "../db";
import type { Tournament, Match, LadderType } from "../schemas";
import { updateTournamentStatus, updateLadderOrder, getTournament } from "./tournaments";
import { trackMatchReported } from "../ga";

/**
 * Start a ladder tournament
 */
export async function startLadderTournament(tournamentId: string): Promise<Tournament | null> {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "draft") {
    return null;
  }

  // Initialize ladder order with participant order
  await updateLadderOrder(tournamentId, [...tournament.participantIds]);

  // Update status to active
  return updateTournamentStatus(tournamentId, "active");
}

/**
 * Report a participant's score/time in ladder mode
 * - For "points" mode: Each new score REPLACES the previous one
 * - For "time" mode: Only saves if it's a BETTER (lower) time
 */
export async function reportLadderScore(
  tournamentId: string,
  participantId: string,
  value: number, // score for points mode, time in seconds for time mode
  ladderType: LadderType = "points"
): Promise<Match | null> {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active") {
    return null;
  }

  // For time mode, check if this is better than current best
  if (ladderType === "time") {
    const existingMatches = await db.getMatchesForTournament(tournamentId);
    const currentBest = getBestTime(participantId, existingMatches);

    // If participant already has a better time, don't save this one
    if (currentBest !== null && value >= currentBest) {
      // Return null but don't error - this is expected behavior
      return null;
    }
  }

  const now = Date.now();

  // Create a score/time record (using Match structure with bId = null)
  const scoreRecord: Match = {
    id: uuidv4(),
    tournamentId,
    aId: participantId,
    bId: null, // Indicates this is an individual score, not a match
    scoreA: value,
    scoreB: 0,
    winnerId: participantId,
    loserId: null,
    status: "completed",
    playedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await db.saveMatch(scoreRecord);

  // Track GA event
  trackMatchReported("ladder", tournamentId);

  return scoreRecord;
}

/**
 * Get the best (lowest) time for a participant
 */
function getBestTime(participantId: string, matches: Match[]): number | null {
  let bestTime: number | null = null;

  for (const match of matches) {
    if (match.bId !== null) continue; // Skip regular matches
    if (match.status !== "completed") continue;
    if (match.aId !== participantId) continue;

    if (bestTime === null || match.scoreA < bestTime) {
      bestTime = match.scoreA;
    }
  }

  return bestTime;
}

/**
 * Get the current score/time for each participant
 * - For "points" mode: Returns the LATEST score
 * - For "time" mode: Returns the BEST (lowest) time
 */
export function getCurrentScores(
  participantIds: string[],
  matches: Match[],
  ladderType: LadderType = "points"
): Map<string, { score: number; recordedAt: number }> {
  const scores = new Map<string, { score: number; recordedAt: number }>();

  // Initialize with 0 for all participants
  for (const id of participantIds) {
    scores.set(id, { score: 0, recordedAt: 0 });
  }

  // Process all score records
  for (const match of matches) {
    if (match.bId !== null) continue; // Skip regular matches
    if (match.status !== "completed") continue;
    if (!match.aId) continue;

    const current = scores.get(match.aId);
    const recordedAt = match.playedAt || match.createdAt;

    if (ladderType === "time") {
      // For time mode: Keep the BEST (lowest) time
      if (!current || current.recordedAt === 0 || match.scoreA < current.score) {
        scores.set(match.aId, { score: match.scoreA, recordedAt });
      }
    } else {
      // For points mode: Keep the LATEST score
      if (!current || recordedAt > current.recordedAt) {
        scores.set(match.aId, { score: match.scoreA, recordedAt });
      }
    }
  }

  return scores;
}

/**
 * Compute ladder standings based on scores/times
 */
export interface LadderStanding {
  participantId: string;
  rank: number;
  score: number;
  hasScore: boolean;
}

export function computeLadderStandings(
  participantIds: string[],
  matches: Match[],
  ladderOrder?: string[],
  ladderType: LadderType = "points"
): LadderStanding[] {
  const currentScores = getCurrentScores(participantIds, matches, ladderType);

  // Create standings array
  const standings: LadderStanding[] = participantIds.map((id) => {
    const scoreData = currentScores.get(id);
    return {
      participantId: id,
      rank: 0,
      score: scoreData?.score || 0,
      hasScore: (scoreData?.recordedAt || 0) > 0,
    };
  });

  // Sort based on ladder type
  standings.sort((a, b) => {
    // Participants without scores go to the bottom
    if (a.hasScore && !b.hasScore) return -1;
    if (!a.hasScore && b.hasScore) return 1;
    if (!a.hasScore && !b.hasScore) return 0;

    // Sort by score/time
    if (a.score !== b.score) {
      if (ladderType === "time") {
        // Time mode: Lower is better (ascending)
        return a.score - b.score;
      } else {
        // Points mode: Higher is better (descending)
        return b.score - a.score;
      }
    }

    // For ties, use ladder order if available
    if (ladderOrder) {
      const aIndex = ladderOrder.indexOf(a.participantId);
      const bIndex = ladderOrder.indexOf(b.participantId);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
    }

    return 0;
  });

  // Assign ranks
  standings.forEach((s, index) => {
    s.rank = index + 1;
  });

  return standings;
}

/**
 * Get score/time history for a participant
 */
export function getScoreHistory(
  participantId: string,
  matches: Match[]
): { score: number; recordedAt: number }[] {
  return matches
    .filter((m) => m.aId === participantId && m.bId === null && m.status === "completed")
    .map((m) => ({ score: m.scoreA, recordedAt: m.playedAt || m.createdAt }))
    .sort((a, b) => b.recordedAt - a.recordedAt);
}

/**
 * Reorder participants within a tie group
 */
export async function reorderTieGroup(
  tournamentId: string,
  participantId: string,
  direction: "up" | "down"
): Promise<Tournament | null> {
  const tournament = await getTournament(tournamentId);
  if (!tournament) return null;

  const ladderType = tournament.settings.ladderType || "points";
  const matches = await db.getMatchesForTournament(tournamentId);
  const standings = computeLadderStandings(
    tournament.participantIds,
    matches,
    tournament.ladderOrder,
    ladderType
  );

  // Find current position
  const currentIndex = standings.findIndex((s) => s.participantId === participantId);
  if (currentIndex === -1) return null;

  const currentStanding = standings[currentIndex];
  if (!currentStanding) return null;

  // Find swap target within same score group
  let targetIndex = -1;

  if (direction === "up" && currentIndex > 0) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      const standingAtI = standings[i];
      if (standingAtI && standingAtI.score === currentStanding.score) {
        targetIndex = i;
        break;
      }
    }
  } else if (direction === "down" && currentIndex < standings.length - 1) {
    for (let i = currentIndex + 1; i < standings.length; i++) {
      const standingAtI = standings[i];
      if (standingAtI && standingAtI.score === currentStanding.score) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex === -1) return null;

  const newOrder = standings.map((s) => s.participantId);
  const temp = newOrder[currentIndex];
  const targetValue = newOrder[targetIndex];
  if (temp !== undefined && targetValue !== undefined) {
    newOrder[currentIndex] = targetValue;
    newOrder[targetIndex] = temp;
  }

  return updateLadderOrder(tournamentId, newOrder);
}

// Keep old function for backwards compatibility but mark as deprecated
/** @deprecated Use reportLadderScore instead */
export async function reportLadderMatch(
  tournamentId: string,
  aId: string,
  bId: string,
  scoreA: number,
  scoreB: number
): Promise<Match | null> {
  // Redirect to new score system - use winner's score
  const winnerId = scoreA > scoreB ? aId : bId;
  const winnerScore = Math.max(scoreA, scoreB);
  return reportLadderScore(tournamentId, winnerId, winnerScore);
}
