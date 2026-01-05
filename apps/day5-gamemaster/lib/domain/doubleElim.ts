import { v4 as uuidv4 } from "uuid";
import * as db from "../db";
import type { Tournament, Match, DoubleBracket, BracketSide } from "../schemas";
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
 * Get number of rounds for a bracket of given size
 */
function getNumRounds(size: number): number {
  return Math.log2(size);
}

/**
 * Calculate the number of losers bracket rounds
 * For size N (power of 2), losers has (winnersRounds - 1) * 2 rounds
 * Example: 4 participants -> 2 winners rounds, 2 losers rounds
 * Example: 8 participants -> 3 winners rounds, 4 losers rounds
 * Example: 16 participants -> 4 winners rounds, 6 losers rounds
 */
function getNumLosersRounds(winnersRounds: number): number {
  return (winnersRounds - 1) * 2;
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
 */
function generateBracketSeeding(numParticipants: number, bracketSize: number): (number | null)[] {
  const slotOrder = generateSlotOrder(bracketSize);
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
 */
function generateSlotOrder(bracketSize: number): number[] {
  let order = [0, 1];

  while (order.length < bracketSize) {
    const newOrder: number[] = [];
    const currentSize = order.length;
    const newSize = currentSize * 2;

    for (let i = 0; i < currentSize; i += 2) {
      const seed1 = order[i]!;
      const seed2 = order[i + 1]!;

      newOrder.push(seed1);
      newOrder.push(newSize - 1 - seed1);
      newOrder.push(seed2);
      newOrder.push(newSize - 1 - seed2);
    }

    order = newOrder;
  }

  return order;
}

/**
 * Create a match object
 */
function createMatch(
  tournamentId: string,
  round: number,
  slot: number,
  bracketSide: BracketSide,
  aId: string | null = null,
  bId: string | null = null,
  now: number
): Match {
  return {
    id: uuidv4(),
    tournamentId,
    round,
    slot,
    bracketSide,
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
}

/**
 * Start a double elimination tournament
 *
 * Structure:
 * - Winners Bracket: Standard single elimination bracket
 * - Losers Bracket: Receives losers from winners
 *   - Odd rounds (1, 3, 5...): Only losers from previous losers round play
 *   - Even rounds (2, 4, 6...): Winners from losers play vs new losers dropping from winners
 * - Grand Final: Winners champion vs Losers champion
 * - Grand Final Reset: If losers champion wins GF (both have 1 life)
 */
export async function startDoubleElimTournament(tournamentId: string): Promise<Tournament | null> {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "draft") {
    return null;
  }

  const participants = tournament.participantIds;
  if (participants.length < 2) {
    return null;
  }

  const bracketSize = nextPowerOf2(participants.length);
  const winnersRounds = getNumRounds(bracketSize);
  const losersRounds = getNumLosersRounds(winnersRounds);
  const now = Date.now();

  // Shuffle participants for random seeding
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // Generate proper bracket seeding (distributes BYEs correctly)
  const seeding = generateBracketSeeding(shuffled.length, bracketSize);

  const allMatches: Match[] = [];
  const winnersBracket: string[][] = [];
  const losersBracket: string[][] = [];

  // ============ Create Winners Bracket ============
  for (let round = 0; round < winnersRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    const roundMatchIds: string[] = [];

    for (let slot = 0; slot < matchesInRound; slot++) {
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

      const match = createMatch(tournamentId, round, slot, "winners", aId, bId, now);
      allMatches.push(match);
      roundMatchIds.push(match.id);
    }

    winnersBracket.push(roundMatchIds);
  }

  // ============ Create Losers Bracket ============
  // Special case: With only 2 participants, there's no losers bracket
  // The loser of the winners final goes directly to Grand Final with 1 life
  //
  // Losers bracket structure for 3+ participants is complex:
  // - Round 0: Losers from Winners R0 play each other
  // - Round 1: Winners of L-R0 vs losers from Winners R1
  // - Round 2: Winners of L-R1 play each other (halving)
  // - Round 3: Winners of L-R2 vs losers from Winners R2
  // - ... and so on

  // Skip losers bracket if only 2 participants
  if (participants.length > 2) {
    for (let lRound = 0; lRound < losersRounds; lRound++) {
      // Calculate matches in this losers round
      // Odd rounds: number halves from previous
      // Even rounds: receives drop-ins from winners

      let matchesInRound: number;
      if (lRound === 0) {
        // First losers round: half of first winners round
        matchesInRound = bracketSize / 4;
      } else if (lRound % 2 === 0) {
        // Even rounds (2, 4, 6...): halving round (no new drop-ins)
        matchesInRound = Math.max(1, Math.ceil(losersBracket[lRound - 1]?.length ?? 1) / 2);
      } else {
        // Odd rounds (1, 3, 5...): integration round with drop-ins
        // Same number as previous round (drop-ins meet survivors)
        matchesInRound = losersBracket[lRound - 1]?.length ?? 1;
      }

      matchesInRound = Math.max(1, matchesInRound);

      const roundMatchIds: string[] = [];

      for (let slot = 0; slot < matchesInRound; slot++) {
        const match = createMatch(tournamentId, lRound, slot, "losers", null, null, now);
        allMatches.push(match);
        roundMatchIds.push(match.id);
      }

      losersBracket.push(roundMatchIds);
    }
  }

  // ============ Create Grand Final ============
  const grandFinalMatch = createMatch(tournamentId, 0, 0, "grand_final", null, null, now);
  allMatches.push(grandFinalMatch);

  // ============ Create Grand Final Reset (Bracket Reset) ============
  const grandFinalResetMatch = createMatch(tournamentId, 0, 0, "grand_final_reset", null, null, now);
  allMatches.push(grandFinalResetMatch);

  // ============ Save all matches ============
  for (const match of allMatches) {
    await db.saveMatch(match);
  }

  // ============ Auto-resolve BYEs in Winners Round 0 ============
  let firstPlayableMatchId: string | undefined;
  const winnersR0 = winnersBracket[0] || [];

  // Track which winners R0 slots had BYEs (no loser will be produced)
  const byeSlots = new Set<number>();

  for (const matchId of winnersR0) {
    const match = allMatches.find((m) => m.id === matchId);
    if (!match) continue;

    if (match.aId && !match.bId) {
      // A gets a BYE
      match.status = "completed";
      match.winnerId = match.aId;
      match.loserId = null; // No loser for BYE
      match.playedAt = now;
      match.updatedAt = now;
      await db.saveMatch(match);
      byeSlots.add(match.slot ?? 0);
      await advanceDoubleElimWinner(match, allMatches, winnersBracket, losersBracket, grandFinalMatch.id, grandFinalResetMatch.id);
    } else if (!match.aId && match.bId) {
      // B gets a BYE
      match.status = "completed";
      match.winnerId = match.bId;
      match.loserId = null;
      match.playedAt = now;
      match.updatedAt = now;
      await db.saveMatch(match);
      byeSlots.add(match.slot ?? 0);
      await advanceDoubleElimWinner(match, allMatches, winnersBracket, losersBracket, grandFinalMatch.id, grandFinalResetMatch.id);
    } else if (match.aId && match.bId && !firstPlayableMatchId) {
      firstPlayableMatchId = match.id;
    }
  }

  // ============ Mark losers R0 slots that will never be filled (due to BYEs) ============
  // In losers R0, matches pair up: slots (0,1)->L0, (2,3)->L1, etc.
  // If a winners R0 slot had a BYE, the corresponding losers position won't get a loser
  if (losersBracket.length > 0) {
    const losersR0 = losersBracket[0] || [];
    for (let losersSlot = 0; losersSlot < losersR0.length; losersSlot++) {
      const losersMatchId = losersR0[losersSlot];
      const losersMatch = losersMatchId ? allMatches.find((m) => m.id === losersMatchId) : undefined;
      if (!losersMatch) continue;

      // This losers match receives losers from winners slots (losersSlot*2) and (losersSlot*2+1)
      const winnersSlotA = losersSlot * 2;
      const winnersSlotB = losersSlot * 2 + 1;
      const slotAHadBye = byeSlots.has(winnersSlotA);
      const slotBHadBye = byeSlots.has(winnersSlotB);

      // Mark slots that will never be filled due to BYEs
      // We use a special marker to know this slot won't receive a loser
      if (slotAHadBye) {
        losersMatch.aId = "__BYE__";
      }
      if (slotBHadBye) {
        losersMatch.bId = "__BYE__";
      }
      await db.saveMatch(losersMatch);
    }
  }

  // Find first playable if not found yet
  if (!firstPlayableMatchId) {
    for (const match of allMatches) {
      if (match.status === "pending" && match.aId && match.bId) {
        firstPlayableMatchId = match.id;
        break;
      }
    }
  }

  // ============ Create DoubleBracket structure ============
  const doubleBracket: DoubleBracket = {
    size: bracketSize,
    winnersBracket,
    losersBracket,
    grandFinalMatchId: grandFinalMatch.id,
    grandFinalResetMatchId: grandFinalResetMatch.id,
    isReset: false,
  };

  // ============ Update Tournament ============
  const updatedTournament: Tournament = {
    ...tournament,
    doubleBracket,
    status: "active",
    nowPlaying: { currentMatchId: firstPlayableMatchId },
    updatedAt: now,
  };

  await db.saveTournament(updatedTournament);
  return updatedTournament;
}

/**
 * Advance winner in double elimination
 */
async function advanceDoubleElimWinner(
  completedMatch: Match,
  allMatches: Match[],
  winnersBracket: string[][],
  losersBracket: string[][],
  grandFinalMatchId: string,
  grandFinalResetMatchId: string
): Promise<void> {
  const { bracketSide, round, slot, winnerId, loserId } = completedMatch;

  if (round === undefined || slot === undefined || !winnerId) return;

  if (bracketSide === "winners") {
    // Advance winner to next winners round
    const nextRound = round + 1;
    if (nextRound < winnersBracket.length) {
      const nextSlot = Math.floor(slot / 2);
      const nextMatchId = winnersBracket[nextRound]?.[nextSlot];
      const nextMatch = nextMatchId ? allMatches.find((m) => m.id === nextMatchId) : undefined;

      if (nextMatch) {
        const isEvenSlot = slot % 2 === 0;
        if (isEvenSlot) {
          nextMatch.aId = winnerId;
        } else {
          nextMatch.bId = winnerId;
        }
        nextMatch.updatedAt = Date.now();
        await db.saveMatch(nextMatch);
      }
    } else {
      // Winner of winners final goes to grand final as A (with 2 lives)
      const grandFinalMatch = allMatches.find((m) => m.id === grandFinalMatchId);
      if (grandFinalMatch) {
        grandFinalMatch.aId = winnerId;
        grandFinalMatch.updatedAt = Date.now();
        await db.saveMatch(grandFinalMatch);
      }
    }

    // Send loser to losers bracket (only if there's a real loser)
    if (loserId) {
      // Special case: no losers bracket (only 2 participants)
      // The loser goes directly to Grand Final as B (with 1 life)
      if (losersBracket.length === 0) {
        const grandFinalMatch = allMatches.find((m) => m.id === grandFinalMatchId);
        if (grandFinalMatch) {
          grandFinalMatch.bId = loserId;
          grandFinalMatch.updatedAt = Date.now();
          await db.saveMatch(grandFinalMatch);
        }
      } else {
        await sendToLosersBracket(round, slot, loserId, allMatches, losersBracket);
      }
    }

  } else if (bracketSide === "losers") {
    // Advance winner to next losers round
    const nextRound = round + 1;
    if (nextRound < losersBracket.length) {
      // Determine position in next round
      let nextSlot: number;
      const nextRoundMatches = losersBracket[nextRound]?.length ?? 1;
      const currentRoundMatches = losersBracket[round]?.length ?? 1;

      if (nextRoundMatches === currentRoundMatches) {
        // Integration round: slot stays same, winner goes to B side
        nextSlot = slot;
      } else {
        // Halving round: standard progression
        nextSlot = Math.floor(slot / 2);
      }

      const nextMatchId = losersBracket[nextRound]?.[nextSlot];
      const nextMatch = nextMatchId ? allMatches.find((m) => m.id === nextMatchId) : undefined;

      if (nextMatch) {
        // In integration rounds, losers bracket survivors go to specific side
        if (nextRoundMatches === currentRoundMatches) {
          // Integration round: survivor (from losers) fills B
          nextMatch.bId = winnerId;
        } else {
          // Halving round: standard A/B fill
          const isEvenSlot = slot % 2 === 0;
          if (isEvenSlot) {
            nextMatch.aId = winnerId;
          } else {
            nextMatch.bId = winnerId;
          }
        }
        nextMatch.updatedAt = Date.now();
        await db.saveMatch(nextMatch);
      }
    } else {
      // Winner of losers final goes to grand final as B (with 1 life)
      const grandFinalMatch = allMatches.find((m) => m.id === grandFinalMatchId);
      if (grandFinalMatch) {
        grandFinalMatch.bId = winnerId;
        grandFinalMatch.updatedAt = Date.now();
        await db.saveMatch(grandFinalMatch);
      }
    }
    // Loser in losers bracket is eliminated (no further action)

  } else if (bracketSide === "grand_final") {
    // Grand Final completed
    const losersChampionWon = winnerId === completedMatch.bId;

    if (losersChampionWon) {
      // Bracket reset! Both players now have 1 life
      const resetMatch = allMatches.find((m) => m.id === grandFinalResetMatchId);
      if (resetMatch) {
        resetMatch.aId = completedMatch.aId; // Former winners champ (now has 1 life)
        resetMatch.bId = completedMatch.bId; // Losers champ (still has 1 life)
        resetMatch.updatedAt = Date.now();
        await db.saveMatch(resetMatch);
      }
    }
    // If winners champion won, tournament is complete (handled in reportDoubleElimMatch)
  }
  // grand_final_reset winner completes the tournament (handled in reportDoubleElimMatch)
}

/**
 * Send a loser from winners bracket to the appropriate losers bracket position
 */
async function sendToLosersBracket(
  winnersRound: number,
  winnersSlot: number,
  loserId: string,
  allMatches: Match[],
  losersBracket: string[][]
): Promise<void> {
  // Calculate which losers round this loser drops into
  // Winners R0 losers -> Losers R0
  // Winners R1 losers -> Losers R1 (integration with L-R0 winners)
  // Winners R2 losers -> Losers R3 (integration with L-R2 winners)
  // Pattern: Winners Rx -> Losers R(2*x - 1) for x > 0, R0 for x = 0

  let targetLosersRound: number;
  if (winnersRound === 0) {
    targetLosersRound = 0;
  } else {
    // Integration rounds in losers are odd-numbered (1, 3, 5...)
    targetLosersRound = winnersRound * 2 - 1;
  }

  if (targetLosersRound >= losersBracket.length) {
    console.error(`Invalid losers round ${targetLosersRound}`);
    return;
  }

  // Calculate slot in losers round
  const losersRoundMatches = losersBracket[targetLosersRound]?.length ?? 0;
  let targetSlot: number;

  if (winnersRound === 0) {
    // First round: losers pair up (0,1 -> 0), (2,3 -> 1), etc.
    targetSlot = Math.floor(winnersSlot / 2);
  } else {
    // Integration rounds: drop-ins fill A side sequentially
    targetSlot = Math.min(winnersSlot, losersRoundMatches - 1);
  }

  const targetMatchId = losersBracket[targetLosersRound]?.[targetSlot];
  const targetMatch = targetMatchId ? allMatches.find((m) => m.id === targetMatchId) : undefined;

  if (targetMatch) {
    if (winnersRound === 0) {
      // First losers round: fill A or B based on original slot
      const isEvenSlot = winnersSlot % 2 === 0;
      if (isEvenSlot) {
        targetMatch.aId = loserId;
      } else {
        targetMatch.bId = loserId;
      }

      // Check if the other side is a BYE marker - auto-advance if so
      const otherSideIsBye = isEvenSlot
        ? targetMatch.bId === "__BYE__"
        : targetMatch.aId === "__BYE__";

      if (otherSideIsBye) {
        // This loser gets a BYE in losers bracket
        targetMatch.aId = isEvenSlot ? loserId : null;
        targetMatch.bId = isEvenSlot ? null : loserId;
        targetMatch.status = "completed";
        targetMatch.winnerId = loserId;
        targetMatch.loserId = null;
        targetMatch.playedAt = Date.now();
        targetMatch.updatedAt = Date.now();
        await db.saveMatch(targetMatch);

        // Advance to next losers round
        await advanceLosersWinner(targetMatch, allMatches, losersBracket);
        return;
      }
    } else {
      // Integration rounds: drop-ins fill A side
      targetMatch.aId = loserId;
    }
    targetMatch.updatedAt = Date.now();
    await db.saveMatch(targetMatch);
  }
}

/**
 * Helper to advance a loser bracket winner (used for BYE auto-advancement)
 */
async function advanceLosersWinner(
  completedMatch: Match,
  allMatches: Match[],
  losersBracket: string[][]
): Promise<void> {
  const { round, slot, winnerId } = completedMatch;
  if (round === undefined || slot === undefined || !winnerId) return;

  const nextRound = round + 1;
  if (nextRound >= losersBracket.length) return;

  const nextRoundMatches = losersBracket[nextRound]?.length ?? 1;
  const currentRoundMatches = losersBracket[round]?.length ?? 1;

  let nextSlot: number;
  if (nextRoundMatches === currentRoundMatches) {
    // Integration round: slot stays same, winner goes to B side
    nextSlot = slot;
  } else {
    // Halving round: standard progression
    nextSlot = Math.floor(slot / 2);
  }

  const nextMatchId = losersBracket[nextRound]?.[nextSlot];
  const nextMatch = nextMatchId ? allMatches.find((m) => m.id === nextMatchId) : undefined;

  if (nextMatch) {
    if (nextRoundMatches === currentRoundMatches) {
      // Integration round: survivor fills B
      nextMatch.bId = winnerId;
    } else {
      // Halving round: standard A/B fill
      const isEvenSlot = slot % 2 === 0;
      if (isEvenSlot) {
        nextMatch.aId = winnerId;
      } else {
        nextMatch.bId = winnerId;
      }
    }
    nextMatch.updatedAt = Date.now();
    await db.saveMatch(nextMatch);
  }
}

/**
 * Report a double elimination match result
 */
export async function reportDoubleElimMatch(
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
  if (!tournament || !tournament.doubleBracket) {
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
  const loserId = scoreA > scoreB ? match.bId : match.aId;
  const now = Date.now();

  // Update match
  const updatedMatch: Match = {
    ...match,
    scoreA,
    scoreB,
    winnerId,
    loserId,
    status: "completed",
    playedAt: now,
    updatedAt: now,
  };

  await db.saveMatch(updatedMatch);

  // Track GA event
  trackMatchReported("double_elim", tournamentId, match.round);

  // Get all matches to advance
  const allMatches = await db.getMatchesForTournament(tournamentId);

  // Advance winner
  const { winnersBracket, losersBracket, grandFinalMatchId, grandFinalResetMatchId } = tournament.doubleBracket;

  await advanceDoubleElimWinner(
    updatedMatch,
    allMatches,
    winnersBracket,
    losersBracket,
    grandFinalMatchId ?? "",
    grandFinalResetMatchId ?? ""
  );

  // Find next playable match
  let nextPlayableMatchId: string | undefined;
  const refreshedMatches = await db.getMatchesForTournament(tournamentId);

  // Priority: winners -> losers -> grand final -> reset
  for (const m of refreshedMatches) {
    if (m.status === "pending" && m.aId && m.bId) {
      nextPlayableMatchId = m.id;
      break;
    }
  }

  // Update now playing
  await updateNowPlaying(tournamentId, nextPlayableMatchId);

  // Check if tournament is complete
  const { bracketSide } = updatedMatch;

  if (bracketSide === "grand_final") {
    // If winners champion won, tournament is complete
    if (winnerId === match.aId) {
      await updateTournamentStatus(tournamentId, "completed");
    } else {
      // Bracket reset - update tournament to reflect reset state
      const updatedDoubleBracket: DoubleBracket = {
        ...tournament.doubleBracket,
        isReset: true,
      };
      await db.saveTournament({
        ...tournament,
        doubleBracket: updatedDoubleBracket,
        updatedAt: now,
      });
    }
  } else if (bracketSide === "grand_final_reset") {
    // Bracket reset completed, tournament is done
    await updateTournamentStatus(tournamentId, "completed");
  }

  return updatedMatch;
}

/**
 * Check if double elimination bracket has any real results
 */
export async function hasAnyDoubleElimResults(tournamentId: string): Promise<boolean> {
  const matches = await db.getMatchesForTournament(tournamentId);
  return matches.some((m) =>
    m.status === "completed" &&
    m.aId &&
    m.bId &&
    (m.scoreA !== 0 || m.scoreB !== 0)
  );
}

/**
 * Get the champion of a completed double elimination tournament
 */
export function getDoubleElimChampion(tournament: Tournament, matches: Match[]): string | null {
  if (!tournament.doubleBracket || tournament.status !== "completed") {
    return null;
  }

  const { grandFinalMatchId, grandFinalResetMatchId, isReset } = tournament.doubleBracket;

  if (isReset && grandFinalResetMatchId) {
    const resetMatch = matches.find((m) => m.id === grandFinalResetMatchId);
    return resetMatch?.winnerId ?? null;
  }

  if (grandFinalMatchId) {
    const grandFinal = matches.find((m) => m.id === grandFinalMatchId);
    return grandFinal?.winnerId ?? null;
  }

  return null;
}

/**
 * Get runner-up of a completed double elimination tournament
 */
export function getDoubleElimRunnerUp(tournament: Tournament, matches: Match[]): string | null {
  if (!tournament.doubleBracket || tournament.status !== "completed") {
    return null;
  }

  const { grandFinalMatchId, grandFinalResetMatchId, isReset } = tournament.doubleBracket;

  if (isReset && grandFinalResetMatchId) {
    const resetMatch = matches.find((m) => m.id === grandFinalResetMatchId);
    return resetMatch?.loserId ?? null;
  }

  if (grandFinalMatchId) {
    const grandFinal = matches.find((m) => m.id === grandFinalMatchId);
    return grandFinal?.loserId ?? null;
  }

  return null;
}

/**
 * Regenerate double elimination bracket (only if no results)
 */
export async function regenerateDoubleElimBracket(tournamentId: string): Promise<Tournament | null> {
  const tournament = await getTournament(tournamentId);
  if (!tournament || tournament.status !== "active" || !tournament.doubleBracket) {
    return null;
  }

  if (await hasAnyDoubleElimResults(tournamentId)) {
    console.error("Cannot regenerate bracket with existing results");
    return null;
  }

  // Delete all existing matches
  const existingMatches = await db.getMatchesForTournament(tournamentId);
  for (const match of existingMatches) {
    await db.deleteMatch(match.id);
  }

  // Reset tournament to draft
  const resetTournament: Tournament = {
    ...tournament,
    status: "draft",
    doubleBracket: undefined,
    nowPlaying: {},
    updatedAt: Date.now(),
  };
  await db.saveTournament(resetTournament);

  // Start fresh
  return startDoubleElimTournament(tournamentId);
}

