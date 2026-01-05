"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Tournament, Participant, Match, BracketSide } from "@/lib/schemas";
import { reportDoubleElimMatch, hasAnyDoubleElimResults, regenerateDoubleElimBracket } from "@/lib/domain/doubleElim";
import { ConfirmDialog } from "./ConfirmDialog";

interface DoubleElimBracketViewProps {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  participantMap: Map<string, Participant>;
  locale: string;
}

interface MatchCardProps {
  match: Match;
  participantMap: Map<string, Participant>;
  isSelected: boolean;
  onSelect: () => void;
  bracketSide: BracketSide;
  t: ReturnType<typeof useTranslations>;
}

function MatchCard({ match, participantMap, isSelected, onSelect, bracketSide, t }: MatchCardProps) {
  const participantA = match.aId ? participantMap.get(match.aId) : null;
  const participantB = match.bId ? participantMap.get(match.bId) : null;

  const isCompleted = match.status === "completed";
  const isReady = match.aId && match.bId;

  // Colors based on bracket side
  const getSideColor = () => {
    if (bracketSide === "grand_final" || bracketSide === "grand_final_reset") {
      return "border-amber-500 dark:border-amber-400";
    }
    if (bracketSide === "winners") {
      return "border-green-500 dark:border-green-400";
    }
    return "border-red-400 dark:border-red-500";
  };

  const getHeaderColor = () => {
    if (bracketSide === "grand_final" || bracketSide === "grand_final_reset") {
      return "bg-amber-50 dark:bg-amber-900/20";
    }
    if (bracketSide === "winners") {
      return "bg-green-50 dark:bg-green-900/20";
    }
    return "bg-red-50 dark:bg-red-900/20";
  };

  return (
    <div
      onClick={() => isReady && !isCompleted && onSelect()}
      className={`w-48 rounded-lg border-2 bg-white transition-all dark:bg-gray-800 ${getSideColor()} ${
        isSelected ? "ring-2 ring-violet-500" : ""
      } ${isReady && !isCompleted ? "cursor-pointer hover:shadow-lg" : "cursor-default"}`}
    >
      {/* Header */}
      <div className={`rounded-t-md px-2 py-1 text-center text-xs font-medium ${getHeaderColor()}`}>
        {bracketSide === "grand_final" && t("tournament.doubleElim.grandFinal")}
        {bracketSide === "grand_final_reset" && t("tournament.doubleElim.grandFinalReset")}
        {bracketSide === "winners" && `${t("tournament.doubleElim.winnersBracket")}`}
        {bracketSide === "losers" && `${t("tournament.doubleElim.losersBracket")}`}
      </div>

      {/* Participant A */}
      <div
        className={`flex items-center justify-between border-b border-gray-200 px-2 py-1 dark:border-gray-700 ${
          isCompleted && match.winnerId === match.aId
            ? "bg-green-100 font-semibold dark:bg-green-900/30"
            : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm text-gray-900 dark:text-white">
            {participantA?.name || (match.aId === null && isCompleted ? t("tournament.bracket.bye") : t("tournament.bracket.tbd"))}
          </span>
          {participantA?.members && participantA.members.length > 0 && (
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
              {participantA.members.map(m => m.name).join(" & ")}
            </span>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {isCompleted && <span className="text-sm text-gray-600 dark:text-gray-300">{match.scoreA}</span>}
          {bracketSide === "grand_final" && match.aId && (
            <span className="text-xs" title={t("tournament.doubleElim.twoLives")}>❤️❤️</span>
          )}
        </div>
      </div>

      {/* Participant B */}
      <div
        className={`flex items-center justify-between px-2 py-1 ${
          isCompleted && match.winnerId === match.bId
            ? "bg-green-100 font-semibold dark:bg-green-900/30"
            : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm text-gray-900 dark:text-white">
            {participantB?.name || (match.bId === null && isCompleted ? t("tournament.bracket.bye") : t("tournament.bracket.tbd"))}
          </span>
          {participantB?.members && participantB.members.length > 0 && (
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
              {participantB.members.map(m => m.name).join(" & ")}
            </span>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {isCompleted && <span className="text-sm text-gray-600 dark:text-gray-300">{match.scoreB}</span>}
          {bracketSide === "grand_final" && match.bId && (
            <span className="text-xs" title={t("tournament.doubleElim.oneLife")}>❤️</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DoubleElimBracketView({
  tournament,
  matches,
  participantMap,
}: DoubleElimBracketViewProps) {
  const t = useTranslations();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(false);

  // Check if can regenerate on mount
  useEffect(() => {
    hasAnyDoubleElimResults(tournament.id).then((hasResults) => {
      setCanRegenerate(!hasResults);
    });
  }, [tournament.id]);

  if (!tournament.doubleBracket) {
    return <div>No bracket data</div>;
  }

  const { winnersBracket, losersBracket, grandFinalMatchId, grandFinalResetMatchId, isReset } = tournament.doubleBracket;

  // Organize matches by bracket side
  const winnersMatches: Match[][] = winnersBracket.map((roundIds) =>
    roundIds.map((id) => matches.find((m) => m.id === id)!).filter(Boolean)
  );

  const losersMatches: Match[][] = losersBracket.map((roundIds) =>
    roundIds.map((id) => matches.find((m) => m.id === id)!).filter(Boolean)
  );

  const grandFinalMatch = matches.find((m) => m.id === grandFinalMatchId);
  const grandFinalResetMatch = matches.find((m) => m.id === grandFinalResetMatchId);

  // Find first playable match (priority: winners by round/slot, then losers, then grand final)
  const firstPlayableMatch = useMemo(() => {
    // Check winners bracket first (by round, then by slot)
    for (const roundMatches of winnersMatches) {
      const sortedRound = [...roundMatches].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
      for (const match of sortedRound) {
        if (match.status === "pending" && match.aId && match.bId) {
          return match;
        }
      }
    }
    // Then losers bracket
    for (const roundMatches of losersMatches) {
      const sortedRound = [...roundMatches].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
      for (const match of sortedRound) {
        if (match.status === "pending" && match.aId && match.bId) {
          return match;
        }
      }
    }
    // Then grand final
    if (grandFinalMatch && grandFinalMatch.status === "pending" && grandFinalMatch.aId && grandFinalMatch.bId) {
      return grandFinalMatch;
    }
    // Then reset match
    if (grandFinalResetMatch && grandFinalResetMatch.status === "pending" && grandFinalResetMatch.aId && grandFinalResetMatch.bId) {
      return grandFinalResetMatch;
    }
    return null;
  }, [winnersMatches, losersMatches, grandFinalMatch, grandFinalResetMatch]);

  // Selected match (or first playable if none selected)
  const selectedMatch = useMemo(() => {
    if (selectedMatchId) {
      const match = matches.find((m) => m.id === selectedMatchId);
      if (match && match.status === "pending" && match.aId && match.bId) {
        return match;
      }
    }
    return firstPlayableMatch;
  }, [selectedMatchId, matches, firstPlayableMatch]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setScoreA(0);
    setScoreB(0);
  };

  const handleReport = async () => {
    if (!selectedMatchId || scoreA === scoreB) return;

    setReporting(true);
    try {
      await reportDoubleElimMatch(tournament.id, selectedMatchId, scoreA, scoreB);
      setSelectedMatchId(null);
      setScoreA(0);
      setScoreB(0);
      setCanRegenerate(false);
    } catch (error) {
      console.error("Failed to report match:", error);
    } finally {
      setReporting(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateDoubleElimBracket(tournament.id);
      setShowRegenerateConfirm(false);
    } catch (error) {
      console.error("Failed to regenerate:", error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("tournament.doubleElim.title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {t("tournament.bracket.clickToSelect")}
          </p>
        </div>
        {canRegenerate && (
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            🔄 {t("tournament.bracket.regenerate")}
          </button>
        )}
      </div>

      {/* Score Input (when match selected) */}
      {selectedMatch && (
        <div className="mb-6 rounded-lg border-2 border-violet-500 bg-violet-50 p-4 dark:bg-violet-900/20">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="text-center">
              <div className="mb-1 font-medium text-gray-900 dark:text-white">
                {participantMap.get(selectedMatch.aId!)?.name}
                {selectedMatch.bracketSide === "grand_final" && <span className="ml-1">❤️❤️</span>}
              </div>
              {participantMap.get(selectedMatch.aId!)?.members &&
               participantMap.get(selectedMatch.aId!)!.members!.length > 0 && (
                <div className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                  {participantMap.get(selectedMatch.aId!)!.members!.map(m => m.name).join(" & ")}
                </div>
              )}
              <input
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 rounded-lg border border-gray-300 p-2 text-center text-xl dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <span className="text-2xl font-bold text-gray-400">vs</span>
            <div className="text-center">
              <div className="mb-1 font-medium text-gray-900 dark:text-white">
                {participantMap.get(selectedMatch.bId!)?.name}
                {selectedMatch.bracketSide === "grand_final" && <span className="ml-1">❤️</span>}
              </div>
              {participantMap.get(selectedMatch.bId!)?.members &&
               participantMap.get(selectedMatch.bId!)!.members!.length > 0 && (
                <div className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                  {participantMap.get(selectedMatch.bId!)!.members!.map(m => m.name).join(" & ")}
                </div>
              )}
              <input
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 rounded-lg border border-gray-300 p-2 text-center text-xl dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={handleReport}
              disabled={scoreA === scoreB || reporting}
              className="ml-4 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {reporting ? t("common.loading") : t("tournament.nowPlaying.reportResult")}
            </button>
            <button
              onClick={() => setSelectedMatchId(null)}
              className="ml-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("common.cancel")}
            </button>
          </div>
          {scoreA === scoreB && scoreA > 0 && (
            <p className="mt-2 text-center text-sm text-amber-600">{t("tournament.nowPlaying.noDraws")}</p>
          )}
        </div>
      )}

      {/* Bracket Reset Alert */}
      {isReset && (
        <div className="mb-6 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-center dark:bg-amber-900/20">
          <div className="text-2xl">🔥</div>
          <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">
            {t("tournament.doubleElim.bracketReset")}
          </h3>
          <p className="text-amber-700 dark:text-amber-300">
            {t("tournament.doubleElim.bracketResetDesc")}
          </p>
        </div>
      )}

      <div className="flex gap-8 overflow-x-auto pb-4">
        {/* LEFT: BRACKETS */}
        <div className="flex-1 space-y-6">
          {/* WINNERS BRACKET */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-green-700 dark:text-green-400">
              <span>🏆</span> {t("tournament.doubleElim.winnersBracket")}
              <span className="text-sm font-normal text-gray-500">({t("tournament.doubleElim.twoLives")})</span>
            </h3>
            <div className="flex items-start gap-6">
              {winnersMatches.map((roundMatches, roundIndex) => (
                <div key={`winners-${roundIndex}`} className="flex flex-col gap-4">
                  <div className="mb-2 text-center text-xs font-medium text-gray-500">
                    {roundIndex === winnersMatches.length - 1
                      ? t("tournament.doubleElim.winnersFinal")
                      : t("tournament.doubleElim.winnersRound", { number: roundIndex + 1 })}
                  </div>
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      participantMap={participantMap}
                      isSelected={selectedMatchId === match.id}
                      onSelect={() => handleSelectMatch(match.id)}
                      bracketSide="winners"
                      t={t}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* LOSERS BRACKET */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-red-600 dark:text-red-400">
              <span>💔</span> {t("tournament.doubleElim.losersBracket")}
              <span className="text-sm font-normal text-gray-500">({t("tournament.doubleElim.oneLife")})</span>
            </h3>
            <div className="flex items-start gap-6">
              {losersMatches.map((roundMatches, roundIndex) => (
                <div key={`losers-${roundIndex}`} className="flex flex-col gap-4">
                  <div className="mb-2 text-center text-xs font-medium text-gray-500">
                    {t("tournament.doubleElim.losersRound", { number: roundIndex + 1 })}
                  </div>
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      participantMap={participantMap}
                      isSelected={selectedMatchId === match.id}
                      onSelect={() => handleSelectMatch(match.id)}
                      bracketSide="losers"
                      t={t}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: GRAND FINAL (Separated) */}
        {grandFinalMatch && (
          <div className="flex flex-col items-center border-l-4 border-amber-400 pl-8 dark:border-amber-500">
            <h3 className="mb-4 text-center text-xl font-bold text-amber-600 dark:text-amber-400">
              🏅 {t("tournament.doubleElim.grandFinal")}
            </h3>

            <div className="flex flex-col items-center gap-4">
              {/* Grand Final Match */}
              <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 p-2 shadow-lg dark:border-amber-500 dark:from-amber-900/30 dark:to-yellow-900/30">
                <MatchCard
                  match={grandFinalMatch}
                  participantMap={participantMap}
                  isSelected={selectedMatchId === grandFinalMatch.id}
                  onSelect={() => handleSelectMatch(grandFinalMatch.id)}
                  bracketSide="grand_final"
                  t={t}
                />
              </div>

              {/* Grand Final Reset */}
              {isReset && grandFinalResetMatch && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="mb-2 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
                    🔥 {t("tournament.doubleElim.grandFinalReset")}
                  </div>
                  <div className="rounded-xl border-2 border-red-400 bg-gradient-to-br from-red-50 to-orange-50 p-2 shadow-lg dark:border-red-500 dark:from-red-900/30 dark:to-orange-900/30">
                    <MatchCard
                      match={grandFinalResetMatch}
                      participantMap={participantMap}
                      isSelected={selectedMatchId === grandFinalResetMatch.id}
                      onSelect={() => handleSelectMatch(grandFinalResetMatch.id)}
                      bracketSide="grand_final_reset"
                      t={t}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-6 rounded-lg bg-gray-100 p-3 text-center text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <p>❤️❤️ = {t("tournament.doubleElim.fromWinners")}</p>
              <p>❤️ = {t("tournament.doubleElim.fromLosers")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Regenerate Dialog */}
      <ConfirmDialog
        open={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title={t("tournament.bracket.regenerate")}
        message={t("tournament.bracket.regenerateConfirm")}
        variant="warning"
      />
    </div>
  );
}

