import { v4 as uuidv4 } from "uuid";
import * as db from "../db";
import type { Tournament, Match, Bracket } from "../schemas";
import { getTournament, updateTournamentStatus, updateNowPlaying } from "./tournaments";
import { trackMatchReported } from "../ga";

/**
 * Get next power of 2 >= n
 */
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return p;
}

/**
 * Get number of rounds for a bracket size
 */
function getNumRounds(size: number): number {
  return Math.log2(size);
}

/**
 * Generate proper bracket seeding
 *
 * For n participants in a bracket of size s:
 * - numByes = s - n (participants that get a bye)
 * - Top seeds get byes, bottom seeds play in round 1
 *
 * Example: 5 participants in 8-bracket
 * - 3 byes (seeds 1, 2, 3 advance to round 2)
 * - 1 real match in round 1 (seeds 4 vs 5)
 *
 * Standard 8-bracket seeding:
 * Match 0: Seed 1 vs Seed 8 (slots 0, 1)
 * Match 1: Seed 4 vs Seed 5 (slots 2, 3)
 * Match 2: Seed 2 vs Seed 7 (slots 4, 5)
 * Match 3: Seed 3 vs Seed 6 (slots 6, 7)
 */
function generateBracketSeeding(numParticipants: number, bracketSize: number): (number | null)[] {
  // Generate the bracket slot order (which seed goes to which slot)
  const slotOrder = generateSlotOrder(bracketSize);

  // slotOrder[i] = which seed (0-indexed) should be in slot i
  // e.g., for 8: [0, 7, 3, 4, 1, 6, 2, 5]
  // Meaning slot 0 has seed 0, slot 1 has seed 7, etc.

  // Create the bracket slots, only filling participants we have
  const slots: (number | null)[] = new Array(bracketSize).fill(null);

  for (let slot = 0; slot < bracketSize; slot++) {
    const seed = slotOrder[slot];
    if (seed !== undefined && seed < numParticipants) {
      slots[slot] = seed;
    }
  }

  return slots;
}

/**
 * Generate standard tournament bracket slot order
 * Returns array where index is slot position and value is seed (0-indexed)
 *
 * For 8-bracket: [0, 7, 3, 4, 1, 6, 2, 5]
 * - Slot 0: Seed 0 (1st), Slot 1: Seed 7 (8th) → Match 0: 1 vs 8
 * - Slot 2: Seed 3 (4th), Slot 3: Seed 4 (5th) → Match 1: 4 vs 5
 * - Slot 4: Seed 1 (2nd), Slot 5: Seed 6 (7th) → Match 2: 2 vs 7
 * - Slot 6: Seed 2 (3rd), Slot 7: Seed 5 (6th) → Match 3: 3 vs 6
 */
function generateSlotOrder(bracketSize: number): number[] {
  // Standard seeding algorithm - iterative approach
  // Start with [0, 1] for size 2, then expand
  let order = [0, 1];

  while (order.length < bracketSize) {
    const newOrder: number[] = [];
    const currentSize = order.length;
    const newSize = currentSize * 2;

    // For each match in current order, split into two matches
    // with complementary seeds
    for (let i = 0; i < currentSize; i += 2) {
      const seed1 = order[i]!;
      const seed2 = order[i + 1]!;

      // First match: seed1 vs its complement in new size
      newOrder.push(seed1);
      newOrder.push(newSize - 1 - seed1);

      // Second match: seed2 vs its complement in new size
      newOrder.push(seed2);
      newOrder.push(newSize - 1 - seed2);
    }

    order = newOrder;
  }

  return order;
}

/**
 * Start a single elimination tournament
 */
export async function startSingleElimTournament(tournamentId: string): Promise<Tournament | null> {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "draft") {
    return null;
  }

  const participants = tournament.participantIds;
  const bracketSize = nextPowerOf2(participants.length);
  const numRounds = getNumRounds(bracketSize);
  const now = Date.now();

  // Shuffle participants for random seeding
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // Generate proper bracket seeding
  const seeding = generateBracketSeeding(shuffled.length, bracketSize);

  // Create matches for all rounds
  const matchesByRound: string[][] = [];
  const allMatches: Match[] = [];

  for (let round = 0; round < numRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    const roundMatchIds: string[] = [];

    for (let slot = 0; slot < matchesInRound; slot++) {
      const matchId = uuidv4();
      roundMatchIds.push(matchId);

      let aId: string | null = null;
      let bId: string | null = null;

      // Only first round has initial participants based on seeding
      if (round === 0) {
        const aSlot = slot * 2;
        const bSlot = slot * 2 + 1;
        const aSeed = seeding[aSlot];
        const bSeed = seeding[bSlot];
        aId = aSeed !== null && aSeed !== undefined ? (shuffled[aSeed] ?? null) : null;
        bId = bSeed !== null && bSeed !== undefined ? (shuffled[bSeed] ?? null) : null;
      }

      const match: Match = {
        id: matchId,
        tournamentId,
        round,
        slot,
        aId,
        bId,
        scoreA: 0,
        scoreB: 0,
        winnerId: null,
        loserId: null,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      allMatches.push(match);
    }

    matchesByRound.push(roundMatchIds);
  }

  // Save all matches
  for (const match of allMatches) {
    await db.saveMatch(match);
  }

  // Auto-resolve BYE matches (where bId is null)
  let firstPlayableMatchId: string | undefined;

  for (const match of allMatches) {
    if (match.round === 0) {
      // BYE: one side is null
      if (match.aId && !match.bId) {
        // A gets a BYE, auto-advance
        match.status = "completed";
        match.winnerId = match.aId;
        match.playedAt = now;
        match.updatedAt = now;
        await db.saveMatch(match);
        await advanceWinner(match, matchesByRound, allMatches);
      } else if (!match.aId && match.bId) {
        // B gets a BYE, auto-advance
        match.status = "completed";
        match.winnerId = match.bId;
        match.playedAt = now;
        match.updatedAt = now;
        await db.saveMatch(match);
        await advanceWinner(match, matchesByRound, allMatches);
      } else if (match.aId && match.bId && !firstPlayableMatchId) {
        // Both sides present, this is playable
        firstPlayableMatchId = match.id;
      }
    }
  }

  // Find first playable match if not found yet
  if (!firstPlayableMatchId) {
    for (const match of allMatches) {
      if (match.status === "pending" && match.aId && match.bId) {
        firstPlayableMatchId = match.id;
        break;
      }
    }
  }

  // Update tournament with bracket and status
  const bracket: Bracket = {
    size: bracketSize,
    matchesByRound,
  };

  const updatedTournament: Tournament = {
    ...tournament,
    bracket,
    status: "active",
    nowPlaying: { currentMatchId: firstPlayableMatchId },
    updatedAt: now,
  };

  await db.saveTournament(updatedTournament);
  return updatedTournament;
}

/**
 * Check if a match in a future round is a true BYE
 * (the other feeder match is also a BYE, so no opponent will ever come)
 */
function isRealBye(
  completedMatch: Match,
  matchesByRound: string[][],
  allMatches: Match[]
): boolean {
  if (completedMatch.round === undefined || completedMatch.slot === undefined) {
    return false;
  }

  // Find the other feeder match for this next match
  const isEvenSlot = completedMatch.slot % 2 === 0;
  const otherSlot = isEvenSlot ? completedMatch.slot + 1 : completedMatch.slot - 1;

  const roundMatches = matchesByRound[completedMatch.round];
  if (!roundMatches) return false;

  const otherMatchId = roundMatches[otherSlot];
  if (!otherMatchId) {
    // No other match exists (odd number of matches in round) - this IS a real bye
    return true;
  }

  const otherMatch = allMatches.find((m) => m.id === otherMatchId);
  if (!otherMatch) return false;

  // If the other match was also a BYE (both sides null in round 0), this is a real BYE
  // But this shouldn't happen in a properly structured bracket
  if (otherMatch.status === "completed" && !otherMatch.aId && !otherMatch.bId) {
    return true;
  }

  return false;
}

/**
 * Advance winner to next round
 */
async function advanceWinner(
  completedMatch: Match,
  matchesByRound: string[][],
  allMatches: Match[]
): Promise<void> {
  if (completedMatch.round === undefined || completedMatch.slot === undefined) {
    return;
  }

  const nextRound = completedMatch.round + 1;
  if (nextRound >= matchesByRound.length) {
    // This was the final
    return;
  }

  const nextSlot = Math.floor(completedMatch.slot / 2);
  const roundMatches = matchesByRound[nextRound];
  if (!roundMatches) return;
  const nextMatchId = roundMatches[nextSlot];
  if (!nextMatchId) return;
  const nextMatch = allMatches.find((m) => m.id === nextMatchId);

  if (!nextMatch) return;

  // Determine which side (A or B) this feeds into
  const isEvenSlot = completedMatch.slot % 2 === 0;

  if (isEvenSlot) {
    nextMatch.aId = completedMatch.winnerId;
  } else {
    nextMatch.bId = completedMatch.winnerId;
  }
  nextMatch.updatedAt = Date.now();

  await db.saveMatch(nextMatch);

  // Only auto-advance if this is a REAL BYE (the other side will never have an opponent)
  // NOT when the other side is still waiting for a match to be played
  if ((nextMatch.aId && !nextMatch.bId) || (!nextMatch.aId && nextMatch.bId)) {
    if (isRealBye(completedMatch, matchesByRound, allMatches)) {
      // Auto-advance this BYE
      nextMatch.status = "completed";
      nextMatch.winnerId = nextMatch.aId || nextMatch.bId;
      nextMatch.playedAt = Date.now();
      nextMatch.updatedAt = Date.now();
      await db.saveMatch(nextMatch);
      await advanceWinner(nextMatch, matchesByRound, allMatches);
    }
    // Otherwise, wait for the other side to be determined
  }
}

/**
 * Report a bracket match result
 */
/**
 * Check if bracket has any completed matches
 */
export async function hasAnyResults(tournamentId: string): Promise<boolean> {
  const matches = await db.getMatchesForTournament(tournamentId);
  // Check for user-reported matches (not auto-BYE advances)
  return matches.some((m) => m.status === "completed" && m.aId && m.bId && m.scoreA !== 0 && m.scoreB !== 0);
}

/**
 * Regenerate bracket matchups (only if no results yet)
 */
export async function regenerateBracket(tournamentId: string): Promise<Tournament | null> {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active" || !tournament.bracket) {
    return null;
  }

  // Check if there are any real results
  if (await hasAnyResults(tournamentId)) {
    console.error("Cannot regenerate bracket with existing results");
    return null;
  }

  // Delete all existing matches
  const existingMatches = await db.getMatchesForTournament(tournamentId);
  for (const match of existingMatches) {
    await db.deleteMatch(match.id);
  }

  // Reset tournament to draft and restart
  const resetTournament: Tournament = {
    ...tournament,
    status: "draft",
    bracket: undefined,
    nowPlaying: {},
    updatedAt: Date.now(),
  };
  await db.saveTournament(resetTournament);

  // Start fresh
  return startSingleElimTournament(tournamentId);
}

/**
 * Report a bracket match result
 */
export async function reportBracketMatch(
  tournamentId: string,
  matchId: string,
  scoreA: number,
  scoreB: number
): Promise<Match | null> {
  if (scoreA === scoreB) {
    console.error("Draws are not allowed");
    return null;
  }

  const tournament = await getTournament(tournamentId);
  if (!tournament || !tournament.bracket) {
    return null;
  }

  const match = await db.getMatch(matchId);
  if (!match || match.tournamentId !== tournamentId) {
    return null;
  }

  if (match.status === "completed") {
    console.error("Match already completed");
    return null;
  }

  if (!match.aId || !match.bId) {
    console.error("Match not ready (missing participant)");
    return null;
  }

  const winnerId = scoreA > scoreB ? match.aId : match.bId;
  const now = Date.now();

  // Update match
  const updatedMatch: Match = {
    ...match,
    scoreA,
    scoreB,
    winnerId,
    status: "completed",
    playedAt: now,
    updatedAt: now,
  };

  await db.saveMatch(updatedMatch);

  // Track GA event
  trackMatchReported("single_elim", tournamentId, match.round);

  // Get all matches to advance winner
  const allMatches = await db.getMatchesForTournament(tournamentId);

  // Advance winner if not final
  if (tournament.bracket && match.round !== undefined && match.round < tournament.bracket.matchesByRound.length - 1) {
    const nextRound = match.round + 1;
    const nextSlot = Math.floor((match.slot || 0) / 2);
    const roundMatches = tournament.bracket.matchesByRound[nextRound];
    const nextMatchId = roundMatches?.[nextSlot];
    const nextMatch = nextMatchId ? allMatches.find((m) => m.id === nextMatchId) : undefined;

    if (nextMatch) {
      const isEvenSlot = (match.slot || 0) % 2 === 0;

      if (isEvenSlot) {
        nextMatch.aId = winnerId;
      } else {
        nextMatch.bId = winnerId;
      }
      nextMatch.updatedAt = now;

      await db.saveMatch(nextMatch);
    }
  }

  // Find next playable match
  let nextPlayableMatchId: string | undefined;
  const refreshedMatches = await db.getMatchesForTournament(tournamentId);

  for (const m of refreshedMatches) {
    if (m.status === "pending" && m.aId && m.bId) {
      nextPlayableMatchId = m.id;
      break;
    }
  }

  // Update now playing
  await updateNowPlaying(tournamentId, nextPlayableMatchId);

  // Check if tournament is complete
  if (tournament.bracket) {
    const finalRound = tournament.bracket.matchesByRound[tournament.bracket.matchesByRound.length - 1];
    const finalMatchId = finalRound?.[0];
    const finalMatch = finalMatchId ? refreshedMatches.find((m) => m.id === finalMatchId) : undefined;

    if (finalMatch?.status === "completed") {
      await updateTournamentStatus(tournamentId, "completed");
    }
  }

  return updatedMatch;
}

