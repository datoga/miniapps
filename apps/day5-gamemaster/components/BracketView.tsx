"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Tournament, Participant, Match } from "@/lib/schemas";
import { reportBracketMatch, regenerateBracket, hasAnyResults } from "@/lib/domain/bracket";
import { NowPlayingCard } from "./NowPlayingCard";
import { ConfirmDialog } from "./ConfirmDialog";

interface BracketViewProps {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  participantMap: Map<string, Participant>;
  locale: string;
}

// Match card dimensions
const MATCH_WIDTH = 200;
const MATCH_HEIGHT = 88;
const MATCH_GAP_V = 24;
const ROUND_GAP = 80;

interface MatchPosition {
  x: number;
  y: number;
  matchId: string;
  round: number;
  slot: number;
}

export function BracketView({ tournament, matches, participantMap }: BracketViewProps) {
  const t = useTranslations();
  const [scoreAStr, setScoreAStr] = useState("0");
  const [scoreBStr, setScoreBStr] = useState("0");
  const [reporting, setReporting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState<boolean | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [scorePanelHidden, setScorePanelHidden] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  // Track last reported round to prefer same round next
  const [lastReportedRound, setLastReportedRound] = useState<number | null>(null);

  // Check if can regenerate on mount
  useEffect(() => {
    hasAnyResults(tournament.id).then((hasResults) => {
      setCanRegenerate(!hasResults);
    });
  }, [tournament.id]);

  // Get all playable matches (pending with both participants), sorted prioritizing last reported round
  const playableMatches = useMemo(() => {
    return matches
      .filter((m) => m.status === "pending" && m.aId && m.bId)
      .sort((a, b) => {
        const aRound = a.round ?? 0;
        const bRound = b.round ?? 0;

        // If we have a last reported round, prioritize matches from that round
        if (lastReportedRound !== null) {
          const aIsSameRound = aRound === lastReportedRound;
          const bIsSameRound = bRound === lastReportedRound;
          if (aIsSameRound && !bIsSameRound) return -1;
          if (!aIsSameRound && bIsSameRound) return 1;
        }

        // Then by round (earlier rounds first)
        if (aRound !== bRound) {
          return aRound - bRound;
        }
        // Then by slot (top matches first)
        return (a.slot ?? 0) - (b.slot ?? 0);
      });
  }, [matches, lastReportedRound]);

  // Selected match (or first playable if none selected and panel not hidden)
  const selectedMatch = useMemo(() => {
    if (scorePanelHidden) {
      return null;
    }
    if (selectedMatchId) {
      const match = matches.find((m) => m.id === selectedMatchId);
      if (match && match.status === "pending" && match.aId && match.bId) {
        return match;
      }
    }
    // Default to first playable
    return playableMatches[0] || null;
  }, [selectedMatchId, matches, playableMatches, scorePanelHidden]);

  const participantA = selectedMatch?.aId ? participantMap.get(selectedMatch.aId) : null;
  const participantB = selectedMatch?.bId ? participantMap.get(selectedMatch.bId) : null;

  // Get round name
  const getRoundName = (roundIndex: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - roundIndex - 1;
    if (roundsFromEnd === 0) return t("tournament.bracket.finals");
    if (roundsFromEnd === 1) return t("tournament.bracket.semifinal");
    if (roundsFromEnd === 2) return t("tournament.bracket.quarterfinal");
    return t("tournament.bracket.round", { number: roundIndex + 1 });
  };

  // Get round name for selected match
  const selectedMatchRoundName = useMemo(() => {
    if (!selectedMatch || !tournament.bracket) return undefined;
    const totalRounds = tournament.bracket.matchesByRound.length;
    const matchRound = selectedMatch.round ?? 0;
    return getRoundName(matchRound, totalRounds);
  }, [selectedMatch, tournament.bracket]);

  // Calculate match positions for SVG lines
  const { positions, svgHeight } = useMemo(() => {
    if (!tournament.bracket) return { positions: [], svgHeight: 0 };

    const matchesByRound = tournament.bracket.matchesByRound;
    const numRounds = matchesByRound.length;
    const positions: MatchPosition[] = [];

    // Calculate positions for each round
    for (let round = 0; round < numRounds; round++) {
      const roundMatchIds = matchesByRound[round] || [];
      const numMatches = roundMatchIds.length;

      // Calculate vertical spacing for this round
      const firstRoundHeight = (matchesByRound[0]?.length || 1) * (MATCH_HEIGHT + MATCH_GAP_V);
      const roundSpacing = firstRoundHeight / numMatches;
      const startOffset = (roundSpacing - MATCH_HEIGHT) / 2;

      for (let slot = 0; slot < numMatches; slot++) {
        const matchId = roundMatchIds[slot];
        if (!matchId) continue;

        positions.push({
          matchId,
          round,
          slot,
          x: round * (MATCH_WIDTH + ROUND_GAP),
          y: startOffset + slot * roundSpacing,
        });
      }
    }

    const maxY = Math.max(...positions.map((p) => p.y + MATCH_HEIGHT), 300);
    return { positions, svgHeight: maxY + MATCH_GAP_V };
  }, [tournament.bracket]);

  const handleReport = async () => {
    if (!selectedMatch) return;

    const scoreA = parseInt(scoreAStr) || 0;
    const scoreB = parseInt(scoreBStr) || 0;

    if (scoreA === scoreB) return;

    // Save the round of the match being reported to prioritize same round next
    setLastReportedRound(selectedMatch.round ?? 0);

    setReporting(true);
    try {
      await reportBracketMatch(tournament.id, selectedMatch.id, scoreA, scoreB);
      setScoreAStr("0");
      setScoreBStr("0");
      setSelectedMatchId(null); // Reset selection
      setCanRegenerate(false);
    } catch (error) {
      console.error("Failed to report match:", error);
    } finally {
      setReporting(false);
    }
  };

  const handleRegenerate = async () => {
    setShowRegenerateConfirm(false);
    setRegenerating(true);
    try {
      await regenerateBracket(tournament.id);
    } catch (error) {
      console.error("Failed to regenerate bracket:", error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleMatchClick = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (match && match.status === "pending" && match.aId && match.bId) {
      setSelectedMatchId(matchId);
      setScorePanelHidden(false);
      setScoreAStr("0");
      setScoreBStr("0");
    }
  };

  const handleCancelSelection = () => {
    setSelectedMatchId(null);
    setScorePanelHidden(true);
    setScoreAStr("0");
    setScoreBStr("0");
  };

  // Check if tournament is completed
  const isCompleted = tournament.status === "completed";
  const finalMatch = tournament.bracket
    ? matches.find(
        (m) =>
          tournament.bracket &&
          m.id === tournament.bracket.matchesByRound[tournament.bracket.matchesByRound.length - 1]?.[0]
      )
    : null;
  const champion = finalMatch?.winnerId ? participantMap.get(finalMatch.winnerId) : null;

  // Generate SVG connector lines - proper bracket style
  const renderConnectorLines = () => {
    if (!tournament.bracket || positions.length === 0) return null;

    const lines: React.ReactElement[] = [];
    const matchesByRound = tournament.bracket.matchesByRound;

    // Header offset - must match the +28 used for card positioning
    const HEADER_OFFSET = 28;

    for (let round = 0; round < matchesByRound.length - 1; round++) {
      const roundMatchIds = matchesByRound[round] || [];
      const nextRoundMatchIds = matchesByRound[round + 1] || [];

      // Process matches in pairs (0-1 -> 0, 2-3 -> 1, etc.)
      for (let pairIndex = 0; pairIndex < Math.ceil(roundMatchIds.length / 2); pairIndex++) {
        const topSlot = pairIndex * 2;
        const bottomSlot = pairIndex * 2 + 1;

        const topMatchId = roundMatchIds[topSlot];
        const bottomMatchId = roundMatchIds[bottomSlot];

        const topMatch = topMatchId ? matches.find((m) => m.id === topMatchId) : null;
        const bottomMatch = bottomMatchId ? matches.find((m) => m.id === bottomMatchId) : null;

        const topPos = topMatchId ? positions.find((p) => p.matchId === topMatchId) : null;
        const bottomPos = bottomMatchId ? positions.find((p) => p.matchId === bottomMatchId) : null;

        // Find the next round match this pair feeds into
        const nextMatchId = nextRoundMatchIds[pairIndex];
        const nextPos = nextMatchId ? positions.find((p) => p.matchId === nextMatchId) : null;

        if (!nextPos) continue;

        const endX = nextPos.x;
        // Add HEADER_OFFSET to Y coordinates to match card positions
        const nextMatchCenterY = nextPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2;

        // Calculate Y positions (with header offset)
        const topCenterY = topPos ? topPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2 : nextMatchCenterY;
        const bottomCenterY = bottomPos ? bottomPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2 : nextMatchCenterY;

        // The junction point where lines meet - exactly between the two source matches
        const junctionY = topPos && bottomPos
          ? (topCenterY + bottomCenterY) / 2
          : topPos
            ? topCenterY
            : bottomCenterY;

        // midX is halfway between source matches and destination
        const sourceEndX = topPos ? topPos.x + MATCH_WIDTH : (bottomPos ? bottomPos.x + MATCH_WIDTH : endX);
        const midX = sourceEndX + (endX - sourceEndX) / 2;

        // Check if this is a single-source pair (no pair partner)
        const hasBothSources = topPos && bottomPos;
        const singleSource = (topPos && !bottomPos) || (!topPos && bottomPos);

        // Draw top match connector
        if (topPos && topMatch) {
          const startX = topPos.x + MATCH_WIDTH;
          const startY = topCenterY;
          const isComplete = topMatch.status === "completed";
          const lineColor = isComplete ? "stroke-emerald-500" : "stroke-gray-300 dark:stroke-gray-600";

          if (singleSource) {
            // Single source: draw direct line to next match (L-shape)
            lines.push(
              <path key={`single-${topMatchId}`}
                d={`M ${startX} ${startY} H ${endX - 10} V ${nextMatchCenterY} H ${endX}`}
                fill="none" className={lineColor} strokeWidth={2} />
            );
          } else {
            // Has pair: draw to junction
            lines.push(
              <path key={`top-h-${topMatchId}`} d={`M ${startX} ${startY} H ${midX}`}
                fill="none" className={lineColor} strokeWidth={2} />
            );
            lines.push(
              <path key={`top-v-${topMatchId}`} d={`M ${midX} ${startY} V ${junctionY}`}
                fill="none" className={lineColor} strokeWidth={2} />
            );
          }
        }

        // Draw bottom match connector
        if (bottomPos && bottomMatch) {
          const startX = bottomPos.x + MATCH_WIDTH;
          const startY = bottomCenterY;
          const isComplete = bottomMatch.status === "completed";
          const lineColor = isComplete ? "stroke-emerald-500" : "stroke-gray-300 dark:stroke-gray-600";

          if (singleSource) {
            // Single source: draw direct line to next match (L-shape)
            lines.push(
              <path key={`single-${bottomMatchId}`}
                d={`M ${startX} ${startY} H ${endX - 10} V ${nextMatchCenterY} H ${endX}`}
                fill="none" className={lineColor} strokeWidth={2} />
            );
          } else {
            // Has pair: draw to junction
            lines.push(
              <path key={`bot-h-${bottomMatchId}`} d={`M ${startX} ${startY} H ${midX}`}
                fill="none" className={lineColor} strokeWidth={2} />
            );
            lines.push(
              <path key={`bot-v-${bottomMatchId}`} d={`M ${midX} ${startY} V ${junctionY}`}
                fill="none" className={lineColor} strokeWidth={2} />
            );
          }
        }

        // Draw horizontal line from junction to next match (only for pairs, not single sources)
        if (hasBothSources) {
          const topComplete = topMatch?.status === "completed";
          const bottomComplete = bottomMatch?.status === "completed";
          const lineColor = (topComplete || bottomComplete)
            ? "stroke-emerald-500"
            : "stroke-gray-300 dark:stroke-gray-600";

          // Horizontal from junction to destination X
          lines.push(
            <path key={`h-to-${nextMatchId}`} d={`M ${midX} ${junctionY} H ${endX}`}
              fill="none" className={lineColor} strokeWidth={2} />
          );

          // Vertical from junctionY to next match center (if different)
          if (Math.abs(junctionY - nextMatchCenterY) > 1) {
            lines.push(
              <path key={`v-to-${nextMatchId}`} d={`M ${endX} ${junctionY} V ${nextMatchCenterY}`}
                fill="none" className={lineColor} strokeWidth={2} />
            );
          }
        }
      }
    }

    return lines;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Tournament Completed */}
      {isCompleted && champion && (
        <div className="mb-8 rounded-lg border-2 border-yellow-500 bg-yellow-50 p-6 text-center dark:border-yellow-400 dark:bg-yellow-900/20">
          <div className="mb-2 text-4xl">🏆</div>
          <h2 className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
            {t("tournament.completed.title")}
          </h2>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {t("tournament.completed.champion")}: {champion.name}
          </p>
        </div>
      )}

      {/* Now Playing Section - Show selected match */}
      {selectedMatch && participantA && participantB && !isCompleted && (
        <NowPlayingCard roundName={selectedMatchRoundName}>
          <div className="space-y-4">
            {/* Match selector if multiple playable */}
            {playableMatches.length > 1 && (
              <div className="mb-2 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  {t("tournament.nowPlaying.selectMatch")} ({playableMatches.length} {t("tournament.bracket.pending").toLowerCase()})
                </span>
              </div>
            )}

            {/* Match Display */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {participantA.name}
                </p>
                {participantA.members && participantA.members.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {participantA.members.map(m => m.name).join(" & ")}
                  </p>
                )}
              </div>
              <span className="text-xl text-gray-400">{t("tournament.nowPlaying.vsLabel")}</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {participantB.name}
                </p>
                {participantB.members && participantB.members.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {participantB.members.map(m => m.name).join(" & ")}
                  </p>
                )}
              </div>
            </div>

            {/* Score Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={scoreAStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty or numeric values only
                    if (val === "" || /^\d+$/.test(val)) {
                      setScoreAStr(val);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-4 text-center text-3xl font-bold text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={scoreBStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty or numeric values only
                    if (val === "" || /^\d+$/.test(val)) {
                      setScoreBStr(val);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-4 text-center text-3xl font-bold text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Report Button */}
            <button
              onClick={handleReport}
              disabled={(parseInt(scoreAStr) || 0) === (parseInt(scoreBStr) || 0) || reporting}
              className="w-full rounded-lg bg-green-600 px-4 py-4 text-lg font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {reporting ? t("common.loading") : t("tournament.nowPlaying.reportResult")}
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleCancelSelection}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("common.cancel")}
            </button>
          </div>
        </NowPlayingCard>
      )}

      {/* Regenerate Button */}
      {canRegenerate && !isCompleted && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={regenerating}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {regenerating ? t("common.loading") : `🔀 ${t("tournament.bracket.regenerate")}`}
          </button>
        </div>
      )}

      {/* Bracket Display with SVG */}
      {tournament.bracket && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("tournament.bracket.title")}
          </h3>

          <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">
            {t("tournament.bracket.clickToSelect")}
          </p>

          <div className="overflow-x-auto pb-4">
            <div
              className="relative"
              style={{
                width: tournament.bracket.matchesByRound.length * (MATCH_WIDTH + ROUND_GAP) - ROUND_GAP + 20,
                height: svgHeight
              }}
            >
              {/* SVG for connector lines */}
              <svg
                className="pointer-events-none absolute inset-0"
                style={{ width: "100%", height: "100%" }}
              >
                {renderConnectorLines()}
              </svg>

              {/* Round headers */}
              <div className="flex" style={{ gap: ROUND_GAP }}>
                {tournament.bracket.matchesByRound.map((_, roundIndex) => (
                  <div
                    key={`header-${roundIndex}`}
                    className="text-center text-sm font-medium text-gray-500 dark:text-gray-300"
                    style={{ width: MATCH_WIDTH }}
                  >
                    {getRoundName(roundIndex, tournament.bracket!.matchesByRound.length)}
                  </div>
                ))}
              </div>

              {/* Match cards positioned absolutely */}
              {positions.map((pos) => {
                const match = matches.find((m) => m.id === pos.matchId);
                if (!match) return null;

                const pA = match.aId ? participantMap.get(match.aId) : null;
                const pB = match.bId ? participantMap.get(match.bId) : null;
                const isSelected = match.id === selectedMatch?.id;
                const isMatchCompleted = match.status === "completed";
                const isPlayable = match.status === "pending" && match.aId && match.bId;
                
                // Detect BYEs: match completed with one side missing
                const isByeA = isMatchCompleted && !match.aId && match.bId;
                const isByeB = isMatchCompleted && !match.bId && match.aId;

                return (
                  <div
                    key={pos.matchId}
                    onClick={() => isPlayable && handleMatchClick(match.id)}
                    className={`absolute rounded-lg border transition-all ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 shadow-lg shadow-violet-200 ring-2 ring-violet-500 dark:border-violet-400 dark:bg-violet-900/20 dark:shadow-violet-900/30 dark:ring-violet-400"
                        : isMatchCompleted
                        ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-900/10"
                        : isPlayable
                        ? "cursor-pointer border-amber-300 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-100/50 dark:border-amber-600 dark:bg-amber-900/10 dark:hover:border-amber-500 dark:hover:bg-amber-900/20"
                        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                    }`}
                    style={{
                      left: pos.x,
                      top: pos.y + 28, // offset for header
                      width: MATCH_WIDTH,
                      height: MATCH_HEIGHT,
                    }}
                  >
                    {/* Playable indicator */}
                    {isPlayable && !isSelected && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                        ▶
                      </div>
                    )}

                    {/* Participant A */}
                    <div
                      className={`flex items-center justify-between border-b border-gray-200 px-2 py-1 dark:border-gray-700 ${
                        isMatchCompleted && match.winnerId === match.aId
                          ? "bg-emerald-100 dark:bg-emerald-800/30"
                          : ""
                      }`}
                      style={{ height: MATCH_HEIGHT / 2 }}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${
                          isMatchCompleted && match.winnerId === match.aId
                            ? "text-emerald-700 dark:text-emerald-400"
                            : isByeA
                              ? "italic text-gray-400 dark:text-gray-500"
                              : "text-gray-900 dark:text-white"
                        }`}>
                          {isByeA 
                            ? t("tournament.bracket.bye")
                            : pA?.name || (match.aId === null ? t("tournament.bracket.tbd") : "")}
                        </span>
                        {pA?.members && pA.members.length > 0 && (
                          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                            {pA.members.map(m => m.name).join(" & ")}
                          </span>
                        )}
                      </div>
                      {isMatchCompleted && !isByeA && !isByeB && (
                        <span className={`ml-1 flex-shrink-0 text-sm font-bold ${
                          match.winnerId === match.aId
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-400"
                        }`}>
                          {match.scoreA}
                        </span>
                      )}
                    </div>
                    {/* Participant B */}
                    <div
                      className={`flex items-center justify-between px-2 py-1 ${
                        isMatchCompleted && match.winnerId === match.bId
                          ? "bg-emerald-100 dark:bg-emerald-800/30"
                          : ""
                      }`}
                      style={{ height: MATCH_HEIGHT / 2 }}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${
                          isMatchCompleted && match.winnerId === match.bId
                            ? "text-emerald-700 dark:text-emerald-400"
                            : isByeB
                              ? "italic text-gray-400 dark:text-gray-500"
                              : "text-gray-900 dark:text-white"
                        }`}>
                          {isByeB
                            ? t("tournament.bracket.bye")
                            : pB?.name || (match.bId === null ? t("tournament.bracket.tbd") : "")}
                        </span>
                        {pB?.members && pB.members.length > 0 && (
                          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                            {pB.members.map(m => m.name).join(" & ")}
                          </span>
                        )}
                      </div>
                      {isMatchCompleted && !isByeA && !isByeB && (
                        <span className={`ml-1 flex-shrink-0 text-sm font-bold ${
                          match.winnerId === match.bId
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-400"
                        }`}>
                          {match.scoreB}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Confirmation Dialog */}
      <ConfirmDialog
        open={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title={t("tournament.bracket.regenerate")}
        message={t("tournament.bracket.regenerateConfirm")}
        variant="warning"
        loading={regenerating}
      />
    </div>
  );
}
