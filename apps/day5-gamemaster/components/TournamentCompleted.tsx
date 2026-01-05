"use client";

import { getDoubleElimChampion, getDoubleElimRunnerUp } from "@/lib/domain/doubleElim";
import { computeLadderStandings } from "@/lib/domain/ladder";
import type { Match, Participant, Tournament } from "@/lib/schemas";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { BracketView } from "./BracketView";
import { DoubleElimBracketView } from "./DoubleElimBracketView";

interface TournamentCompletedProps {
  tournament: Tournament;
  matches: Match[];
  participants: Participant[];
  participantMap: Map<string, Participant>;
  locale: string;
}

// Confetti particle
interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
}

const CONFETTI_COLORS = [
  "#FFD700", // Gold
  "#C0C0C0", // Silver
  "#CD7F32", // Bronze
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
];

export function TournamentCompleted({
  tournament,
  matches,
  participants,
  participantMap,
  locale,
}: TournamentCompletedProps) {
  const t = useTranslations();
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showConfetti, setShowConfetti] = useState(true);
  const [showBracket, setShowBracket] = useState(false);

  const ladderType = tournament.settings.ladderType || "points";
  const isTimeMode = ladderType === "time";
  const isLadder = tournament.mode === "ladder";

  // Get winners based on tournament mode
  // Returns { first, second, thirdPlace: Participant[] } for elimination modes
  const getWinners = useCallback((): {
    first: { participant: Participant | undefined; score: number | null };
    second: { participant: Participant | undefined; score: number | null };
    thirdPlace: Participant[];
  } => {
    if (isLadder) {
      const standings = computeLadderStandings(
        tournament.participantIds,
        matches,
        tournament.ladderOrder,
        ladderType
      );
      return {
        first: {
          participant: standings[0] ? participantMap.get(standings[0].participantId) : undefined,
          score: standings[0]?.hasScore ? standings[0].score : null,
        },
        second: {
          participant: standings[1] ? participantMap.get(standings[1].participantId) : undefined,
          score: standings[1]?.hasScore ? standings[1].score : null,
        },
        thirdPlace: standings[2]
          ? [participantMap.get(standings[2].participantId)].filter((p): p is Participant => !!p)
          : [],
      };
    } else if (tournament.mode === "double_elim") {
      // For double elimination
      const championId = getDoubleElimChampion(tournament, matches);
      const runnerUpId = getDoubleElimRunnerUp(tournament, matches);

      // For 3rd place: find the loser of the losers bracket final
      const losersMatches = matches
        .filter((m) => m.bracketSide === "losers" && m.status === "completed")
        .sort((a, b) => (b.round || 0) - (a.round || 0));
      const losersLastMatch = losersMatches[0];
      const thirdPlaceId = losersLastMatch?.loserId;

      return {
        first: {
          participant: championId ? participantMap.get(championId) : undefined,
          score: null,
        },
        second: {
          participant: runnerUpId ? participantMap.get(runnerUpId) : undefined,
          score: null,
        },
        thirdPlace: thirdPlaceId
          ? [participantMap.get(thirdPlaceId)].filter((p): p is Participant => !!p)
          : [],
      };
    } else {
      // For single elimination bracket: find the final match winner
      const completedMatches = matches.filter((m) => m.status === "completed" && m.winnerId);
      if (completedMatches.length === 0) {
        return {
          first: { participant: undefined, score: null },
          second: { participant: undefined, score: null },
          thirdPlace: [],
        };
      }

      // Sort by round to find final
      const sortedMatches = completedMatches.sort((a, b) => (b.round || 0) - (a.round || 0));
      const finalMatch = sortedMatches[0];

      if (!finalMatch) {
        return {
          first: { participant: undefined, score: null },
          second: { participant: undefined, score: null },
          thirdPlace: [],
        };
      }

      const winner = finalMatch.winnerId ? participantMap.get(finalMatch.winnerId) : undefined;
      const loserId = finalMatch.aId === finalMatch.winnerId ? finalMatch.bId : finalMatch.aId;
      const runnerUp = loserId ? participantMap.get(loserId) : undefined;

      // Find ALL semifinal losers for 3rd place (both of them!)
      const semifinalRound = (finalMatch.round || 1) - 1;
      const semiFinals = completedMatches.filter((m) => m.round === semifinalRound);
      const thirdPlaceCandidates = semiFinals
        .map((m) => {
          const mLoserId = m.aId === m.winnerId ? m.bId : m.aId;
          return mLoserId ? participantMap.get(mLoserId) : undefined;
        })
        .filter((p): p is Participant => !!p);

      return {
        first: { participant: winner, score: null },
        second: { participant: runnerUp, score: null },
        thirdPlace: thirdPlaceCandidates,
      };
    }
  }, [isLadder, tournament, matches, participantMap, ladderType]);

  const { first, second, thirdPlace } = getWinners();

  // Format score value (milliseconds to M'SS"ms for time mode)
  const formatScoreValue = (value: number) => {
    if (isTimeMode) {
      const totalSecs = Math.floor(value / 1000);
      const ms = value % 1000;
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      if (ms > 0) {
        return `${mins}'${secs.toString().padStart(2, "0")}"${ms.toString().padStart(3, "0")}`;
      }
      return `${mins}'${secs.toString().padStart(2, "0")}"`;
    }
    return value.toString();
  };

  // Generate confetti
  useEffect(() => {
    if (!showConfetti) {
      return;
    }

    const generateConfetti = () => {
      const newConfetti: Confetti[] = [];
      for (let i = 0; i < 100; i++) {
        newConfetti.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          rotation: Math.random() * 360,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] || "#FFD700",
          size: 8 + Math.random() * 8,
          speedX: (Math.random() - 0.5) * 2,
          speedY: 2 + Math.random() * 3,
        });
      }
      setConfetti(newConfetti);
    };

    generateConfetti();

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showConfetti]);

  // Animate confetti
  useEffect(() => {
    if (!showConfetti || confetti.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setConfetti((prev) =>
        prev
          .map((c) => ({
            ...c,
            x: c.x + c.speedX,
            y: c.y + c.speedY,
            rotation: c.rotation + 5,
          }))
          .filter((c) => c.y < 120)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [showConfetti, confetti.length]);

  return (
    <div className="relative min-h-[80vh] overflow-hidden bg-gradient-to-b from-violet-900 via-purple-900 to-indigo-900 px-4 py-8">
      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                transform: `rotate(${c.rotation}deg)`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 text-6xl">🏆</div>
        <h1 className="mb-2 text-4xl font-black text-white drop-shadow-lg md:text-5xl">
          {t("tournament.completed.title")}
        </h1>
        <p className="text-xl text-white/80">{tournament.name}</p>
        <p className="mt-1 text-sm text-white/60">
          {isLadder
            ? isTimeMode
              ? t("tournament.ladder.rankingByTime")
              : t("tournament.ladder.rankingByPoints")
            : tournament.mode === "double_elim"
              ? t("tournament.doubleElim.title")
              : t("tournament.bracket.singleElimination")}
        </p>
      </div>

      {/* Podium */}
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-center gap-2 md:gap-4">
          {/* 2nd Place */}
          <div className="flex w-1/3 flex-col items-center">
            <div className="mb-2 text-center">
              <div className="text-4xl">🥈</div>
              <p className="mt-1 truncate text-lg font-bold text-white md:text-xl">
                {second?.participant?.name || "-"}
              </p>
              {isLadder && second?.score !== null && second?.score !== undefined && (
                <p className="text-sm text-gray-300">
                  {formatScoreValue(second.score)}
                  {!isTimeMode && " pts"}
                </p>
              )}
            </div>
            <div className="h-24 w-full rounded-t-lg bg-gradient-to-t from-gray-400 to-gray-300 shadow-lg md:h-32">
              <div className="flex h-full items-center justify-center text-4xl font-black text-gray-600 md:text-5xl">
                2
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex w-1/3 flex-col items-center">
            <div className="mb-2 text-center">
              <div className="animate-bounce text-5xl md:text-6xl">🥇</div>
              <p className="mt-1 truncate text-xl font-black text-yellow-300 drop-shadow-lg md:text-2xl">
                {first?.participant?.name || "-"}
              </p>
              {isLadder && first?.score !== null && first?.score !== undefined && (
                <p className="text-lg font-semibold text-yellow-200">
                  {formatScoreValue(first.score)}
                  {!isTimeMode && " pts"}
                </p>
              )}
            </div>
            <div className="h-36 w-full rounded-t-lg bg-gradient-to-t from-yellow-500 to-yellow-300 shadow-xl md:h-44">
              <div className="flex h-full items-center justify-center text-5xl font-black text-yellow-700 md:text-6xl">
                1
              </div>
            </div>
          </div>

          {/* 3rd Place - Shows both semifinal losers */}
          <div className="flex w-1/3 flex-col items-center">
            <div className="mb-2 text-center">
              <div className="text-4xl">🥉</div>
              {thirdPlace.length > 1 ? (
                // Multiple third place winners (both semifinal losers)
                <div className="mt-1 space-y-0.5">
                  {thirdPlace.map((p, idx) => (
                    <p
                      key={p.id || idx}
                      className="truncate text-base font-bold text-white md:text-lg"
                    >
                      {p.name}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 truncate text-lg font-bold text-white md:text-xl">
                  {thirdPlace[0]?.name || "-"}
                </p>
              )}
            </div>
            <div className="h-16 w-full rounded-t-lg bg-gradient-to-t from-amber-700 to-amber-500 shadow-lg md:h-24">
              <div className="flex h-full items-center justify-center text-3xl font-black text-amber-900 md:text-4xl">
                3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Ranking/Bracket button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => setShowBracket(!showBracket)}
          className="rounded-full bg-white/20 px-6 py-2 text-white backdrop-blur-sm transition hover:bg-white/30"
        >
          📊{" "}
          {showBracket
            ? isLadder
              ? t("tournament.completed.hideRanking")
              : t("tournament.completed.hideBracket")
            : isLadder
              ? t("tournament.completed.viewRanking")
              : t("tournament.completed.viewBracket")}
        </button>
      </div>

      {/* Full Ranking for Ladder */}
      {showBracket && isLadder && first.participant && (
        <div className="mx-auto mt-8 max-w-xl">
          <h3 className="mb-4 text-center text-lg font-semibold text-white/80">
            {t("tournament.completed.fullRanking")}
          </h3>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="space-y-2">
              {computeLadderStandings(
                tournament.participantIds,
                matches,
                tournament.ladderOrder,
                ladderType
              ).map((standing, idx) => {
                const participant = participantMap.get(standing.participantId);
                const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;

                return (
                  <div
                    key={standing.participantId}
                    className={`flex items-center justify-between rounded-lg px-4 py-2 ${
                      idx < 3 ? "bg-white/20" : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center text-lg">
                        {medal || <span className="text-white/60">{idx + 1}</span>}
                      </span>
                      <span className={`font-medium ${idx < 3 ? "text-white" : "text-white/70"}`}>
                        {participant?.name || "Unknown"}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${idx < 3 ? "text-white" : "text-white/60"}`}
                    >
                      {standing.hasScore ? formatScoreValue(standing.score) : "-"}
                      {standing.hasScore && !isTimeMode && (
                        <span className="ml-1 text-sm">pts</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full Bracket View */}
      {showBracket && !isLadder && (
        <div className="mx-auto mt-8 max-w-7xl overflow-x-auto rounded-xl bg-white/10 p-4 backdrop-blur-sm">
          {tournament.mode === "double_elim" ? (
            <DoubleElimBracketView
              tournament={tournament}
              participants={participants}
              matches={matches}
              participantMap={participantMap}
              locale={locale}
            />
          ) : (
            <BracketView
              tournament={tournament}
              participants={participants}
              matches={matches}
              participantMap={participantMap}
              locale={locale}
            />
          )}
        </div>
      )}
    </div>
  );
}
