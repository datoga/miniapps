"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@miniapps/ui";
import type { Tournament, Participant, Match } from "@/lib/schemas";
import { computeLadderStandings } from "@/lib/domain/ladder";
import { getDoubleElimChampion, getDoubleElimRunnerUp } from "@/lib/domain/doubleElim";

interface TournamentTVProps {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  participantMap: Map<string, Participant>;
  lastSyncTime?: number;
  isRefreshing?: boolean;
}

export function TournamentTV({
  tournament,
  participants,
  matches,
  participantMap,
  lastSyncTime,
  isRefreshing,
}: TournamentTVProps) {
  const t = useTranslations();
  const [currentTime, setCurrentTime] = useState(new Date());

  const ladderType = tournament.settings.ladderType || "points";
  const isTimeMode = ladderType === "time";
  const isLadder = tournament.mode === "ladder";

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format score value (milliseconds to M'SS"ms for time mode)
  const formatScoreValue = useCallback((value: number) => {
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
  }, [isTimeMode]);

  // Get standings for ladder mode
  const standings = isLadder
    ? computeLadderStandings(
        tournament.participantIds,
        matches,
        tournament.ladderOrder,
        ladderType
      )
    : [];

  // Get podium data for completed tournaments
  const podiumData = useMemo(() => {
    if (tournament.status !== "completed") return null;

    if (isLadder) {
      return {
        first: standings[0] ? { name: participantMap.get(standings[0].participantId)?.name, score: standings[0].hasScore ? standings[0].score : null } : null,
        second: standings[1] ? { name: participantMap.get(standings[1].participantId)?.name, score: standings[1].hasScore ? standings[1].score : null } : null,
        thirdPlace: standings[2] ? [participantMap.get(standings[2].participantId)?.name].filter(Boolean) as string[] : [],
      };
    } else if (tournament.mode === "double_elim") {
      const championId = getDoubleElimChampion(tournament, matches);
      const runnerUpId = getDoubleElimRunnerUp(tournament, matches);

      // For 3rd place: find the loser of the losers bracket final
      const losersMatches = matches
        .filter((m) => m.bracketSide === "losers" && m.status === "completed")
        .sort((a, b) => (b.round || 0) - (a.round || 0));
      const losersLastMatch = losersMatches[0];
      const thirdPlaceId = losersLastMatch?.loserId;

      return {
        first: championId ? { name: participantMap.get(championId)?.name, score: null } : null,
        second: runnerUpId ? { name: participantMap.get(runnerUpId)?.name, score: null } : null,
        thirdPlace: thirdPlaceId ? [participantMap.get(thirdPlaceId)?.name].filter(Boolean) as string[] : [],
      };
    } else {
      // Single elimination
      const completedMatches = matches.filter((m) => m.status === "completed" && m.winnerId);
      if (completedMatches.length === 0) return null;

      const sortedMatches = completedMatches.sort((a, b) => (b.round || 0) - (a.round || 0));
      const finalMatch = sortedMatches[0];
      if (!finalMatch) return null;

      const winnerId = finalMatch.winnerId;
      const loserId = finalMatch.aId === winnerId ? finalMatch.bId : finalMatch.aId;

      // Find ALL semifinal losers for 3rd place
      const semifinalRound = (finalMatch.round || 1) - 1;
      const semiFinals = completedMatches.filter((m) => m.round === semifinalRound);
      const thirdPlaceNames = semiFinals
        .map((m) => {
          const mLoserId = m.aId === m.winnerId ? m.bId : m.aId;
          return mLoserId ? participantMap.get(mLoserId)?.name : undefined;
        })
        .filter(Boolean) as string[];

      return {
        first: winnerId ? { name: participantMap.get(winnerId)?.name, score: null } : null,
        second: loserId ? { name: participantMap.get(loserId)?.name, score: null } : null,
        thirdPlace: thirdPlaceNames,
      };
    }
  }, [tournament, matches, isLadder, standings, participantMap]);

  // Get bracket matches organized by round
  const getBracketData = useCallback(() => {
    if (isLadder) return null;

    const matchesByRound = new Map<number, Match[]>();
    for (const match of matches) {
      const round = match.round || 1;
      if (!matchesByRound.has(round)) {
        matchesByRound.set(round, []);
      }
      matchesByRound.get(round)?.push(match);
    }

    // Sort matches within each round by slot
    for (const [round, roundMatches] of matchesByRound) {
      matchesByRound.set(
        round,
        roundMatches.sort((a, b) => (a.slot || 0) - (b.slot || 0))
      );
    }

    return matchesByRound;
  }, [isLadder, matches]);

  const bracketData = getBracketData();

  // Get ranking position display
  const getRankDisplay = (rank: number, hasScore: boolean) => {
    if (!hasScore) return { badge: null, bgClass: "opacity-30" };

    if (rank === 1) {
      return {
        badge: "🥇",
        bgClass: "bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border-l-4 border-yellow-400",
      };
    }
    if (rank === 2) {
      return {
        badge: "🥈",
        bgClass: "bg-gradient-to-r from-gray-300/20 to-slate-300/20 border-l-4 border-gray-400",
      };
    }
    if (rank === 3) {
      return {
        badge: "🥉",
        bgClass: "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-l-4 border-amber-600",
      };
    }
    return { badge: null, bgClass: "" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-100 to-gray-100 text-gray-900 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 dark:text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-8 py-4 dark:border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🏆</span>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{tournament.name}</h1>
            <p className="text-lg text-gray-500 dark:text-white/60">
              {isLadder
                ? isTimeMode
                  ? t("tournament.ladder.rankingByTime")
                  : t("tournament.ladder.rankingByPoints")
                : t("tournament.bracket.singleElimination")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="text-right">
            <div className="font-mono text-4xl font-bold tabular-nums">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="flex items-center justify-end gap-2 text-sm text-gray-400 dark:text-white/50">
              {isRefreshing && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                  {t("tournament.tv.syncing")}
                </span>
              )}
              {lastSyncTime && (
                <span>
                  {t("tournament.tv.lastUpdate")}: {new Date(lastSyncTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {/* Tournament Completed - Podium */}
        {tournament.status === "completed" && podiumData && (
          <div className="flex min-h-[70vh] flex-col items-center justify-center">
            <div className="mb-6 text-7xl">🏆</div>
            <h2 className="mb-12 text-5xl font-black">{t("tournament.completed.title")}</h2>

            {/* Podium */}
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {/* 2nd Place */}
              <div className="flex w-48 flex-col items-center md:w-56">
                <div className="mb-3 text-center">
                  <div className="text-5xl md:text-6xl">🥈</div>
                  <p className="mt-2 truncate text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
                    {podiumData.second?.name || "-"}
                  </p>
                  {isLadder && podiumData.second?.score !== null && podiumData.second?.score !== undefined && (
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      {formatScoreValue(podiumData.second.score)}
                      {!isTimeMode && " pts"}
                    </p>
                  )}
                </div>
                <div className="h-32 w-full rounded-t-xl bg-gradient-to-t from-gray-500 to-gray-400 shadow-2xl md:h-40">
                  <div className="flex h-full items-center justify-center text-5xl font-black text-gray-700 md:text-6xl">
                    2
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex w-52 flex-col items-center md:w-64">
                <div className="mb-3 text-center">
                  <div className="animate-bounce text-6xl md:text-7xl">🥇</div>
                  <p className="mt-2 truncate text-2xl font-black text-yellow-600 drop-shadow-lg dark:text-yellow-400 md:text-3xl">
                    {podiumData.first?.name || "-"}
                  </p>
                  {isLadder && podiumData.first?.score !== null && podiumData.first?.score !== undefined && (
                    <p className="text-xl font-semibold text-yellow-700 dark:text-yellow-200">
                      {formatScoreValue(podiumData.first.score)}
                      {!isTimeMode && " pts"}
                    </p>
                  )}
                </div>
                <div className="h-44 w-full rounded-t-xl bg-gradient-to-t from-yellow-500 to-yellow-300 shadow-2xl md:h-56">
                  <div className="flex h-full items-center justify-center text-6xl font-black text-yellow-700 md:text-7xl">
                    1
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex w-48 flex-col items-center md:w-56">
                <div className="mb-3 text-center">
                  <div className="text-5xl md:text-6xl">🥉</div>
                  {podiumData.thirdPlace.length > 1 ? (
                    <div className="mt-2 space-y-0.5">
                      {podiumData.thirdPlace.map((name, idx) => (
                        <p key={idx} className="truncate text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                          {name}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 truncate text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
                      {podiumData.thirdPlace[0] || "-"}
                    </p>
                  )}
                </div>
                <div className="h-24 w-full rounded-t-xl bg-gradient-to-t from-amber-700 to-amber-500 shadow-2xl md:h-32">
                  <div className="flex h-full items-center justify-center text-4xl font-black text-amber-900 md:text-5xl">
                    3
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ladder Mode - TV View */}
        {tournament.status === "active" && isLadder && (
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-700 dark:text-white/80">
              {t("tournament.ladder.title")}
            </h2>
            <div className="space-y-2">
              {standings.map((standing) => {
                const participant = participantMap.get(standing.participantId);
                const rank = standing.rank;
                const { badge, bgClass } = getRankDisplay(rank, standing.hasScore);

                return (
                  <div
                    key={standing.participantId}
                    className={`flex items-center gap-6 rounded-xl px-6 py-4 transition-all ${bgClass}`}
                  >
                    {/* Rank */}
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center">
                      {badge ? (
                        <span className="text-5xl">{badge}</span>
                      ) : (
                        <span className={`text-4xl font-black ${
                          standing.hasScore ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/30"
                        }`}>
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-grow">
                      <span className={`font-bold ${
                        rank <= 3 && standing.hasScore
                          ? "text-4xl"
                          : "text-3xl"
                      } ${standing.hasScore ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/40"}`}>
                        {participant?.name || "Unknown"}
                      </span>
                    </div>

                    {/* Score/Time */}
                    <div className="text-right">
                      <span className={`font-mono font-black ${
                        rank === 1 && standing.hasScore
                          ? "text-5xl text-yellow-600 dark:text-yellow-400"
                          : rank <= 3 && standing.hasScore
                          ? "text-4xl text-gray-900 dark:text-white"
                          : standing.hasScore
                          ? "text-3xl text-gray-700 dark:text-white/80"
                          : "text-3xl text-gray-400 dark:text-white/30"
                      }`}>
                        {standing.hasScore ? formatScoreValue(standing.score) : "-"}
                      </span>
                      {!isTimeMode && standing.hasScore && (
                        <span className="ml-2 text-xl text-gray-500 dark:text-white/50">pts</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {standings.length === 0 && (
                <div className="py-16 text-center text-2xl text-gray-400 dark:text-white/40">
                  {t("tournament.ladder.noParticipants")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bracket Mode - TV View */}
        {tournament.status === "active" && !isLadder && bracketData && (
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-8 px-4">
              {Array.from(bracketData.entries())
                .sort(([a], [b]) => a - b)
                .map(([round, roundMatches]) => (
                  <div key={round} className="flex flex-col gap-4">
                    <h3 className="mb-2 text-center text-xl font-bold text-gray-500 dark:text-white/60">
                      {t("tournament.bracket.round", { number: round })}
                    </h3>
                    <div className="flex flex-col justify-around gap-4" style={{ minHeight: "60vh" }}>
                      {roundMatches.map((match) => {
                        const participantA = match.aId ? participantMap.get(match.aId) : null;
                        const participantB = match.bId ? participantMap.get(match.bId) : null;
                        const isCompleted = match.status === "completed";
                        const isBye = !match.bId && match.aId;

                        return (
                          <div
                            key={match.id}
                            className={`w-72 rounded-xl border-2 ${
                              isCompleted
                                ? "border-green-500/50 bg-green-100 dark:bg-green-900/20"
                                : "border-gray-300 bg-gray-50 dark:border-white/20 dark:bg-white/5"
                            }`}
                          >
                            {/* Participant A */}
                            <div
                              className={`flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10 ${
                                isCompleted && match.winnerId === match.aId
                                  ? "bg-green-200/50 dark:bg-green-500/20"
                                  : ""
                              }`}
                            >
                              <span className={`text-xl font-semibold ${
                                participantA ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/30"
                              }`}>
                                {participantA?.name || (isBye ? "-" : t("tournament.bracket.tbd"))}
                              </span>
                              {isCompleted && (
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {match.scoreA}
                                </span>
                              )}
                              {isCompleted && match.winnerId === match.aId && (
                                <span className="text-xl">✓</span>
                              )}
                            </div>
                            {/* Participant B */}
                            <div
                              className={`flex items-center justify-between px-4 py-3 ${
                                isCompleted && match.winnerId === match.bId
                                  ? "bg-green-200/50 dark:bg-green-500/20"
                                  : ""
                              }`}
                            >
                              <span className={`text-xl font-semibold ${
                                participantB ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/30"
                              }`}>
                                {participantB?.name || (isBye ? t("tournament.bracket.bye") : t("tournament.bracket.tbd"))}
                              </span>
                              {isCompleted && !isBye && (
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {match.scoreB}
                                </span>
                              )}
                              {isCompleted && match.winnerId === match.bId && (
                                <span className="text-xl">✓</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Draft Status */}
        {tournament.status === "draft" && (
          <div className="flex min-h-[70vh] flex-col items-center justify-center">
            <div className="mb-8 text-8xl">⏳</div>
            <h2 className="mb-4 text-4xl font-bold text-gray-700 dark:text-white/80">
              {t("tournament.tv.preparing")}
            </h2>
            <p className="text-2xl text-gray-500 dark:text-white/50">
              {t("dashboard.participants", { count: participants.length })}
            </p>
          </div>
        )}
      </main>

      {/* Footer with sync status */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/80 px-8 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-black/50">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-white/40">
          <span>{t("tournament.tv.mode")}</span>
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isRefreshing ? "animate-pulse bg-green-400" : "bg-gray-400 dark:bg-white/30"}`} />
            {t("tournament.tv.autoRefresh")}
          </span>
        </div>
      </footer>
    </div>
  );
}

