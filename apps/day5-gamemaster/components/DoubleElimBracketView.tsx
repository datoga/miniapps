"use client";

import {
  hasAnyDoubleElimResults,
  regenerateDoubleElimBracket,
  reportDoubleElimMatch,
} from "@/lib/domain/doubleElim";
import type { BracketSide, Match, Participant, Tournament } from "@/lib/schemas";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { NowPlayingCard } from "./NowPlayingCard";

// Match card dimensions (same as BracketView for consistency)
const MATCH_WIDTH = 176; // w-44 = 11rem = 176px
const MATCH_HEIGHT = 72; // Approximate height of match card
const MATCH_GAP_V = 16;
const ROUND_GAP = 64;

interface MatchPosition {
  x: number;
  y: number;
  matchId: string;
  round: number;
  slot: number;
}

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

function MatchCard({
  match,
  participantMap,
  isSelected,
  onSelect,
  bracketSide,
  t,
}: MatchCardProps) {
  // Handle BYEs: explicit __BYE__ marker OR null when match is completed (auto-resolved BYE)
  const isCompleted = match.status === "completed";
  const isByeA = match.aId === "__BYE__" || (isCompleted && !match.aId && match.bId);
  const isByeB = match.bId === "__BYE__" || (isCompleted && !match.bId && match.aId);
  const participantA = match.aId && match.aId !== "__BYE__" ? participantMap.get(match.aId) : null;
  const participantB = match.bId && match.bId !== "__BYE__" ? participantMap.get(match.bId) : null;
  const isPlayable = match.aId && match.bId && !isByeA && !isByeB && !isCompleted;

  // Get card styling based on state - simplified like single elimination
  const getCardStyle = () => {
    if (isSelected) {
      return "border-violet-500 bg-white shadow-lg ring-2 ring-violet-500 dark:border-violet-400 dark:bg-gray-800 dark:ring-violet-400";
    }
    if (isCompleted) {
      return "border-emerald-400 bg-white dark:border-emerald-500 dark:bg-gray-800";
    }
    if (isPlayable) {
      return "cursor-pointer border-amber-400 bg-white hover:border-amber-500 hover:shadow-md dark:border-amber-500 dark:bg-gray-800 dark:hover:border-amber-400";
    }
    return "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  };

  // Only show header for grand final matches
  const showHeader = bracketSide === "grand_final" || bracketSide === "grand_final_reset";

  // In Grand Final: A comes from Winners (2 lives), B comes from Losers (1 life)
  // In Grand Final Reset: both have 1 life
  const isGrandFinal = bracketSide === "grand_final";
  const isGrandFinalReset = bracketSide === "grand_final_reset";
  const livesA = isGrandFinalReset ? 1 : isGrandFinal ? 2 : null;
  const livesB = isGrandFinal || isGrandFinalReset ? 1 : null;

  return (
    <div
      onClick={() => isPlayable && onSelect()}
      className={`relative w-44 overflow-hidden rounded-lg border-2 transition-all ${getCardStyle()}`}
    >
      {/* Playable indicator */}
      {isPlayable && !isSelected && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white shadow">
          ▶
        </div>
      )}

      {/* Header - only for grand final */}
      {showHeader && (
        <div className="bg-amber-100 px-2 py-1 text-center text-xs font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
          {bracketSide === "grand_final"
            ? `🏆 ${t("tournament.doubleElim.grandFinal")}`
            : t("tournament.doubleElim.grandFinalReset")}
        </div>
      )}

      {/* Participant A */}
      <div
        className={`flex items-center justify-between border-b px-3 py-2 ${
          isCompleted && match.winnerId === match.aId
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30"
            : "border-gray-100 dark:border-gray-700"
        }`}
      >
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-medium ${
              isCompleted && match.winnerId === match.aId
                ? "text-emerald-700 dark:text-emerald-400"
                : isByeA
                  ? "italic text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-white"
            }`}
          >
            {isByeA ? (
              t("tournament.bracket.bye")
            ) : participantA?.name ? (
              <>
                {participantA.name}
                {livesA !== null && <span className="ml-1 text-xs">{"❤️".repeat(livesA)}</span>}
              </>
            ) : match.aId === null ? (
              t("tournament.bracket.tbd")
            ) : (
              ""
            )}
          </span>
          {participantA?.members && participantA.members.length > 0 && (
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
              {participantA.members.map((m) => m.name).join(" & ")}
            </span>
          )}
        </div>
        {isCompleted && !isByeA && !isByeB && (
          <span
            className={`ml-2 text-lg font-bold ${
              match.winnerId === match.aId
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          >
            {match.scoreA}
          </span>
        )}
      </div>

      {/* Participant B */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          isCompleted && match.winnerId === match.bId ? "bg-emerald-50 dark:bg-emerald-900/30" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-medium ${
              isCompleted && match.winnerId === match.bId
                ? "text-emerald-700 dark:text-emerald-400"
                : isByeB
                  ? "italic text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-white"
            }`}
          >
            {isByeB ? (
              t("tournament.bracket.bye")
            ) : participantB?.name ? (
              <>
                {participantB.name}
                {livesB !== null && <span className="ml-1 text-xs">{"❤️".repeat(livesB)}</span>}
              </>
            ) : match.bId === null ? (
              t("tournament.bracket.tbd")
            ) : (
              ""
            )}
          </span>
          {participantB?.members && participantB.members.length > 0 && (
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
              {participantB.members.map((m) => m.name).join(" & ")}
            </span>
          )}
        </div>
        {isCompleted && !isByeA && !isByeB && (
          <span
            className={`ml-2 text-lg font-bold ${
              match.winnerId === match.bId
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          >
            {match.scoreB}
          </span>
        )}
      </div>
    </div>
  );
}

// Winners Bracket with SVG connector lines
interface WinnersBracketSVGProps {
  winnersMatches: Match[][];
  participantMap: Map<string, Participant>;
  selectedMatchId: string | null;
  onSelectMatch: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}

function WinnersBracketSVG({
  winnersMatches,
  participantMap,
  selectedMatchId,
  onSelectMatch,
  t,
}: WinnersBracketSVGProps) {
  // Calculate positions for all matches
  const { positions, svgWidth, svgHeight } = useMemo(() => {
    const numRounds = winnersMatches.length;
    const positions: MatchPosition[] = [];

    // Calculate positions for each round
    for (let round = 0; round < numRounds; round++) {
      const roundMatches = winnersMatches[round] || [];
      const numMatches = roundMatches.length;

      // Calculate vertical spacing for this round
      const firstRoundHeight = (winnersMatches[0]?.length || 1) * (MATCH_HEIGHT + MATCH_GAP_V);
      const roundSpacing = firstRoundHeight / numMatches;
      const startOffset = (roundSpacing - MATCH_HEIGHT) / 2;

      for (let slot = 0; slot < numMatches; slot++) {
        const match = roundMatches[slot];
        if (!match) {
          continue;
        }

        positions.push({
          matchId: match.id,
          round,
          slot,
          x: round * (MATCH_WIDTH + ROUND_GAP),
          y: startOffset + slot * roundSpacing,
        });
      }
    }

    const maxX = numRounds * (MATCH_WIDTH + ROUND_GAP) - ROUND_GAP + 20;
    const maxY = Math.max(...positions.map((p) => p.y + MATCH_HEIGHT), 200);
    return { positions, svgWidth: maxX, svgHeight: maxY + MATCH_GAP_V };
  }, [winnersMatches]);

  // Generate SVG connector lines
  const renderConnectorLines = () => {
    if (positions.length === 0) {
      return null;
    }

    const lines: React.ReactElement[] = [];
    const HEADER_OFFSET = 28; // offset for round headers

    for (let round = 0; round < winnersMatches.length - 1; round++) {
      const roundMatches = winnersMatches[round] || [];
      const nextRoundMatches = winnersMatches[round + 1] || [];

      // Process matches in pairs
      for (let pairIndex = 0; pairIndex < Math.ceil(roundMatches.length / 2); pairIndex++) {
        const topSlot = pairIndex * 2;
        const bottomSlot = pairIndex * 2 + 1;

        const topMatch = roundMatches[topSlot];
        const bottomMatch = roundMatches[bottomSlot];

        const topPos = topMatch ? positions.find((p) => p.matchId === topMatch.id) : null;
        const bottomPos = bottomMatch ? positions.find((p) => p.matchId === bottomMatch.id) : null;

        // Find the next round match this pair feeds into
        const nextMatch = nextRoundMatches[pairIndex];
        const nextPos = nextMatch ? positions.find((p) => p.matchId === nextMatch.id) : null;

        if (!nextPos) {
          continue;
        }

        const endX = nextPos.x;
        const nextMatchCenterY = nextPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2;

        // Calculate Y positions with header offset
        const topCenterY = topPos ? topPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2 : nextMatchCenterY;
        const bottomCenterY = bottomPos
          ? bottomPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2
          : nextMatchCenterY;

        // Junction point - exactly between the two source matches
        const junctionY =
          topPos && bottomPos
            ? (topCenterY + bottomCenterY) / 2
            : topPos
              ? topCenterY
              : bottomCenterY;

        // midX is halfway between source matches and destination
        const sourceEndX = topPos
          ? topPos.x + MATCH_WIDTH
          : bottomPos
            ? bottomPos.x + MATCH_WIDTH
            : endX;
        const midX = sourceEndX + (endX - sourceEndX) / 2;

        const hasBothSources = topPos && bottomPos;
        const singleSource = (topPos && !bottomPos) || (!topPos && bottomPos);

        // Draw top match connector
        if (topPos && topMatch) {
          const startX = topPos.x + MATCH_WIDTH;
          const startY = topCenterY;
          const isComplete = topMatch.status === "completed";
          const lineColor = isComplete
            ? "stroke-emerald-500"
            : "stroke-gray-300 dark:stroke-gray-600";

          if (singleSource) {
            lines.push(
              <path
                key={`single-${topMatch.id}`}
                d={`M ${startX} ${startY} H ${endX - 10} V ${nextMatchCenterY} H ${endX}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
          } else {
            lines.push(
              <path
                key={`top-h-${topMatch.id}`}
                d={`M ${startX} ${startY} H ${midX}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
            lines.push(
              <path
                key={`top-v-${topMatch.id}`}
                d={`M ${midX} ${startY} V ${junctionY}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
          }
        }

        // Draw bottom match connector
        if (bottomPos && bottomMatch) {
          const startX = bottomPos.x + MATCH_WIDTH;
          const startY = bottomCenterY;
          const isComplete = bottomMatch.status === "completed";
          const lineColor = isComplete
            ? "stroke-emerald-500"
            : "stroke-gray-300 dark:stroke-gray-600";

          if (singleSource) {
            lines.push(
              <path
                key={`single-${bottomMatch.id}`}
                d={`M ${startX} ${startY} H ${endX - 10} V ${nextMatchCenterY} H ${endX}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
          } else {
            lines.push(
              <path
                key={`bot-h-${bottomMatch.id}`}
                d={`M ${startX} ${startY} H ${midX}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
            lines.push(
              <path
                key={`bot-v-${bottomMatch.id}`}
                d={`M ${midX} ${startY} V ${junctionY}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
          }
        }

        // Draw horizontal line from junction to next match
        if (hasBothSources && nextMatch) {
          const topComplete = topMatch?.status === "completed";
          const bottomComplete = bottomMatch?.status === "completed";
          const lineColor =
            topComplete || bottomComplete
              ? "stroke-emerald-500"
              : "stroke-gray-300 dark:stroke-gray-600";

          lines.push(
            <path
              key={`h-to-${nextMatch.id}`}
              d={`M ${midX} ${junctionY} H ${endX}`}
              fill="none"
              className={lineColor}
              strokeWidth={2}
            />
          );

          if (Math.abs(junctionY - nextMatchCenterY) > 1) {
            lines.push(
              <path
                key={`v-to-${nextMatch.id}`}
                d={`M ${endX} ${junctionY} V ${nextMatchCenterY}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
          }
        }
      }
    }

    return lines;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="relative" style={{ width: svgWidth, height: svgHeight }}>
        {/* SVG for connector lines */}
        <svg
          className="pointer-events-none absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        >
          {renderConnectorLines()}
        </svg>

        {/* Round headers */}
        <div className="flex" style={{ gap: ROUND_GAP }}>
          {winnersMatches.map((_, roundIndex) => (
            <div
              key={`header-${roundIndex}`}
              className="text-center text-xs font-medium text-gray-500"
              style={{ width: MATCH_WIDTH }}
            >
              {roundIndex === winnersMatches.length - 1
                ? t("tournament.doubleElim.winnersFinal")
                : t("tournament.doubleElim.winnersRound", { number: roundIndex + 1 })}
            </div>
          ))}
        </div>

        {/* Match cards positioned absolutely */}
        {positions.map((pos) => {
          const match = winnersMatches[pos.round]?.[pos.slot];
          if (!match) {
            return null;
          }

          return (
            <div
              key={pos.matchId}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y + 28, // offset for header
                width: MATCH_WIDTH,
              }}
            >
              <MatchCard
                match={match}
                participantMap={participantMap}
                isSelected={selectedMatchId === match.id}
                onSelect={() => onSelectMatch(match.id)}
                bracketSide="winners"
                t={t}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Losers Bracket with SVG connector lines
interface LosersBracketSVGProps {
  losersMatches: Match[][];
  participantMap: Map<string, Participant>;
  selectedMatchId: string | null;
  onSelectMatch: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}

function LosersBracketSVG({
  losersMatches,
  participantMap,
  selectedMatchId,
  onSelectMatch,
  t,
}: LosersBracketSVGProps) {
  // Calculate positions for all matches in losers bracket
  const { positions, svgWidth, svgHeight } = useMemo(() => {
    const numRounds = losersMatches.length;
    const positions: MatchPosition[] = [];

    // For losers bracket, use a simpler vertical layout
    // Each round has potentially different number of matches
    for (let round = 0; round < numRounds; round++) {
      const roundMatches = losersMatches[round] || [];
      const numMatches = roundMatches.length;
      if (numMatches === 0) {
        continue;
      }

      // Calculate vertical spacing - use first round as reference
      const maxMatchesInAnyRound = Math.max(...losersMatches.map((r) => r.length));
      const totalHeight = maxMatchesInAnyRound * (MATCH_HEIGHT + MATCH_GAP_V);
      const roundSpacing = totalHeight / numMatches;
      const startOffset = (roundSpacing - MATCH_HEIGHT) / 2;

      for (let slot = 0; slot < numMatches; slot++) {
        const match = roundMatches[slot];
        if (!match) {
          continue;
        }

        positions.push({
          matchId: match.id,
          round,
          slot,
          x: round * (MATCH_WIDTH + ROUND_GAP),
          y: startOffset + slot * roundSpacing,
        });
      }
    }

    const maxX = numRounds * (MATCH_WIDTH + ROUND_GAP) - ROUND_GAP + 20;
    const maxY = Math.max(...positions.map((p) => p.y + MATCH_HEIGHT), 200);
    return { positions, svgWidth: maxX, svgHeight: maxY + MATCH_GAP_V };
  }, [losersMatches]);

  // Generate SVG connector lines for losers bracket
  const renderConnectorLines = () => {
    if (positions.length === 0) {
      return null;
    }

    const lines: React.ReactElement[] = [];
    const HEADER_OFFSET = 28;

    // For losers bracket, draw simple horizontal lines from each match to the next round
    for (let round = 0; round < losersMatches.length - 1; round++) {
      const roundMatches = losersMatches[round] || [];
      const nextRoundMatches = losersMatches[round + 1] || [];

      for (let slot = 0; slot < roundMatches.length; slot++) {
        const match = roundMatches[slot];
        if (!match) {
          continue;
        }

        const pos = positions.find((p) => p.matchId === match.id);
        if (!pos) {
          continue;
        }

        // Find the target match in the next round
        // In losers bracket: integration rounds (odd) have same count as previous
        // Halving rounds (even) reduce by half
        const isNextIntegration = (round + 1) % 2 === 1;
        const targetSlot = isNextIntegration ? slot : Math.floor(slot / 2);
        const nextMatch = nextRoundMatches[targetSlot];
        const nextPos = nextMatch ? positions.find((p) => p.matchId === nextMatch.id) : null;

        if (!nextPos) {
          continue;
        }

        const startX = pos.x + MATCH_WIDTH;
        const startY = pos.y + HEADER_OFFSET + MATCH_HEIGHT / 2;
        const endX = nextPos.x;
        const endY = nextPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2;

        const isComplete = match.status === "completed";
        const lineColor = isComplete
          ? "stroke-emerald-500"
          : "stroke-gray-300 dark:stroke-gray-600";

        // For halving rounds (even to odd), two matches feed one
        if (!isNextIntegration && slot % 2 === 0) {
          // First of pair - draw to junction
          const partner = roundMatches[slot + 1];
          const partnerPos = partner ? positions.find((p) => p.matchId === partner.id) : null;

          if (partnerPos) {
            const junctionY = (startY + partnerPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2) / 2;
            const midX = startX + (endX - startX) / 2;

            // Horizontal from this match to midpoint
            lines.push(
              <path
                key={`l-h1-${match.id}`}
                d={`M ${startX} ${startY} H ${midX}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
            // Vertical to junction
            lines.push(
              <path
                key={`l-v1-${match.id}`}
                d={`M ${midX} ${startY} V ${junctionY}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
            // Horizontal from junction to next match
            const partnerComplete = partner?.status === "completed";
            const junctionColor =
              isComplete || partnerComplete
                ? "stroke-emerald-500"
                : "stroke-gray-300 dark:stroke-gray-600";
            lines.push(
              <path
                key={`l-hj-${match.id}`}
                d={`M ${midX} ${junctionY} H ${endX}`}
                fill="none"
                className={junctionColor}
                strokeWidth={2}
              />
            );
            // Vertical from junction to target if needed
            if (Math.abs(junctionY - endY) > 1) {
              lines.push(
                <path
                  key={`l-vj-${match.id}`}
                  d={`M ${endX} ${junctionY} V ${endY}`}
                  fill="none"
                  className={junctionColor}
                  strokeWidth={2}
                />
              );
            }
          }
        } else if (!isNextIntegration && slot % 2 === 1) {
          // Second of pair - draw to junction
          const partnerPos = positions.find((p) => p.matchId === roundMatches[slot - 1]?.id);
          if (partnerPos) {
            const junctionY = (partnerPos.y + HEADER_OFFSET + MATCH_HEIGHT / 2 + startY) / 2;
            const midX = startX + (endX - startX) / 2;

            lines.push(
              <path
                key={`l-h2-${match.id}`}
                d={`M ${startX} ${startY} H ${midX}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
            lines.push(
              <path
                key={`l-v2-${match.id}`}
                d={`M ${midX} ${startY} V ${junctionY}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
          }
        } else {
          // Integration round - direct line (may need vertical adjustment)
          const midX = startX + (endX - startX) / 2;
          lines.push(
            <path
              key={`l-h-${match.id}`}
              d={`M ${startX} ${startY} H ${midX}`}
              fill="none"
              className={lineColor}
              strokeWidth={2}
            />
          );
          if (Math.abs(startY - endY) > 1) {
            lines.push(
              <path
                key={`l-v-${match.id}`}
                d={`M ${midX} ${startY} V ${endY}`}
                fill="none"
                className={lineColor}
                strokeWidth={2}
              />
            );
          }
          lines.push(
            <path
              key={`l-h2-${match.id}`}
              d={`M ${midX} ${endY} H ${endX}`}
              fill="none"
              className={lineColor}
              strokeWidth={2}
            />
          );
        }
      }
    }

    return lines;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="relative" style={{ width: svgWidth, height: svgHeight }}>
        {/* SVG for connector lines */}
        <svg
          className="pointer-events-none absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        >
          {renderConnectorLines()}
        </svg>

        {/* Round headers */}
        <div className="flex" style={{ gap: ROUND_GAP }}>
          {losersMatches.map((_, roundIndex) => (
            <div
              key={`l-header-${roundIndex}`}
              className="text-center text-xs font-medium text-gray-500"
              style={{ width: MATCH_WIDTH }}
            >
              {t("tournament.doubleElim.losersRound", { number: roundIndex + 1 })}
            </div>
          ))}
        </div>

        {/* Match cards positioned absolutely */}
        {positions.map((pos) => {
          const match = losersMatches[pos.round]?.[pos.slot];
          if (!match) {
            return null;
          }

          return (
            <div
              key={pos.matchId}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y + 28,
                width: MATCH_WIDTH,
              }}
            >
              <MatchCard
                match={match}
                participantMap={participantMap}
                isSelected={selectedMatchId === match.id}
                onSelect={() => onSelectMatch(match.id)}
                bracketSide="losers"
                t={t}
              />
            </div>
          );
        })}
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
  // Use "__HIDDEN__" to explicitly hide the score panel (vs null = auto-select first)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [scorePanelHidden, setScorePanelHidden] = useState(false);
  const [scoreAStr, setScoreAStr] = useState("0");
  const [scoreBStr, setScoreBStr] = useState("0");
  const [reporting, setReporting] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(false);
  // Track last reported match to prefer same bracket side/round
  const [lastReportedContext, setLastReportedContext] = useState<{
    bracketSide?: string;
    round?: number;
  } | null>(null);

  // Check if can regenerate on mount
  useEffect(() => {
    hasAnyDoubleElimResults(tournament.id).then((hasResults) => {
      setCanRegenerate(!hasResults);
    });
  }, [tournament.id]);

  if (!tournament.doubleBracket) {
    return <div>No bracket data</div>;
  }

  const { winnersBracket, losersBracket, grandFinalMatchId, grandFinalResetMatchId, isReset } =
    tournament.doubleBracket;

  // Organize matches by bracket side
  const winnersMatches: Match[][] = winnersBracket.map((roundIds) =>
    roundIds.map((id) => matches.find((m) => m.id === id)!).filter(Boolean)
  );

  const losersMatches: Match[][] = losersBracket.map((roundIds) =>
    roundIds.map((id) => matches.find((m) => m.id === id)!).filter(Boolean)
  );

  const grandFinalMatch = matches.find((m) => m.id === grandFinalMatchId);
  const grandFinalResetMatch = matches.find((m) => m.id === grandFinalResetMatchId);

  // Find first playable match (prioritize same bracket side/round as last reported)
  const firstPlayableMatch = useMemo(() => {
    // Collect all playable matches
    const allPlayable: Match[] = [];

    // Winners
    for (const roundMatches of winnersMatches) {
      for (const match of roundMatches) {
        if (match.status === "pending" && match.aId && match.bId) {
          allPlayable.push(match);
        }
      }
    }
    // Losers
    for (const roundMatches of losersMatches) {
      for (const match of roundMatches) {
        if (match.status === "pending" && match.aId && match.bId) {
          allPlayable.push(match);
        }
      }
    }
    // Grand final
    if (
      grandFinalMatch &&
      grandFinalMatch.status === "pending" &&
      grandFinalMatch.aId &&
      grandFinalMatch.bId
    ) {
      allPlayable.push(grandFinalMatch);
    }
    // Reset match
    if (
      grandFinalResetMatch &&
      grandFinalResetMatch.status === "pending" &&
      grandFinalResetMatch.aId &&
      grandFinalResetMatch.bId
    ) {
      allPlayable.push(grandFinalResetMatch);
    }

    if (allPlayable.length === 0) {
      return null;
    }

    // Sort to prioritize: same bracket side + same round first, then same bracket side, then by natural order
    const sorted = [...allPlayable].sort((a, b) => {
      const ctx = lastReportedContext;

      // If we have context from last report, prioritize same side+round
      if (ctx) {
        const aMatchesSide = a.bracketSide === ctx.bracketSide;
        const bMatchesSide = b.bracketSide === ctx.bracketSide;
        const aMatchesRound = (a.round ?? 0) === ctx.round;
        const bMatchesRound = (b.round ?? 0) === ctx.round;

        // Same side + same round is highest priority
        const aSameContext = aMatchesSide && aMatchesRound;
        const bSameContext = bMatchesSide && bMatchesRound;
        if (aSameContext && !bSameContext) {
          return -1;
        }
        if (!aSameContext && bSameContext) {
          return 1;
        }

        // Same side (different round) is next priority
        if (aMatchesSide && !bMatchesSide) {
          return -1;
        }
        if (!aMatchesSide && bMatchesSide) {
          return 1;
        }
      }

      // Default: winners before losers, earlier rounds first, then by slot
      const sideOrder: Record<string, number> = {
        winners: 0,
        losers: 1,
        grand_final: 2,
        grand_final_reset: 3,
      };
      const aSideOrder = sideOrder[a.bracketSide || "winners"] ?? 0;
      const bSideOrder = sideOrder[b.bracketSide || "winners"] ?? 0;
      if (aSideOrder !== bSideOrder) {
        return aSideOrder - bSideOrder;
      }

      const aRound = a.round ?? 0;
      const bRound = b.round ?? 0;
      if (aRound !== bRound) {
        return aRound - bRound;
      }

      return (a.slot ?? 0) - (b.slot ?? 0);
    });

    return sorted[0];
  }, [winnersMatches, losersMatches, grandFinalMatch, grandFinalResetMatch, lastReportedContext]);

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
    return firstPlayableMatch;
  }, [selectedMatchId, matches, firstPlayableMatch, scorePanelHidden]);

  // Get round name for selected match
  const selectedMatchRoundName = useMemo(() => {
    if (!selectedMatch) {
      return undefined;
    }

    const side = selectedMatch.bracketSide;
    const round = (selectedMatch.round ?? 0) + 1;

    if (side === "grand_final") {
      return t("tournament.doubleElim.grandFinal");
    }
    if (side === "grand_final_reset") {
      return t("tournament.doubleElim.grandFinalReset");
    }
    if (side === "winners") {
      return t("tournament.doubleElim.winnersRound", { number: round });
    }
    if (side === "losers") {
      return t("tournament.doubleElim.losersRound", { number: round });
    }
    return undefined;
  }, [selectedMatch, t]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setScorePanelHidden(false);
    setScoreAStr("0");
    setScoreBStr("0");
  };

  const handleCancelSelection = () => {
    setSelectedMatchId(null);
    setScorePanelHidden(true);
    setScoreAStr("0");
    setScoreBStr("0");
  };

  const handleReport = async () => {
    // Use selectedMatch (which falls back to firstPlayableMatch) instead of selectedMatchId
    if (!selectedMatch) {
      return;
    }

    const scoreA = parseInt(scoreAStr) || 0;
    const scoreB = parseInt(scoreBStr) || 0;

    if (scoreA === scoreB) {
      return;
    }

    // Save context of the match being reported to prioritize same round next
    setLastReportedContext({
      bracketSide: selectedMatch.bracketSide,
      round: selectedMatch.round ?? 0,
    });

    setReporting(true);
    try {
      await reportDoubleElimMatch(tournament.id, selectedMatch.id, scoreA, scoreB);
      setSelectedMatchId(null);
      setScoreAStr("0");
      setScoreBStr("0");
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

  // Check if tournament is completed
  const isTournamentCompleted = tournament.status === "completed";

  // Get champion - winner of grand final (or grand final reset if it happened)
  const getChampion = () => {
    if (!isTournamentCompleted) {
      return null;
    }
    // Check reset match first
    if (grandFinalResetMatch?.status === "completed" && grandFinalResetMatch.winnerId) {
      return participantMap.get(grandFinalResetMatch.winnerId);
    }
    // Otherwise check grand final
    if (grandFinalMatch?.status === "completed" && grandFinalMatch.winnerId) {
      return participantMap.get(grandFinalMatch.winnerId);
    }
    return null;
  };
  const champion = getChampion();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Tournament Completed */}
      {isTournamentCompleted && champion && (
        <div className="mb-8 rounded-lg border-2 border-yellow-500 bg-yellow-50 p-6 text-center dark:border-yellow-400 dark:bg-yellow-900/20">
          <div className="mb-2 text-4xl">🏆</div>
          <h2 className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
            {t("tournament.completed.title")}
          </h2>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {t("tournament.completed.champion")}: {champion.name}
          </p>
          {champion.members && champion.members.length > 0 && (
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {champion.members.map((m) => m.name).join(" & ")}
            </p>
          )}
        </div>
      )}

      {/* Score Input (when match selected and not completed) - Using NowPlayingCard for consistency */}
      {selectedMatch && !isTournamentCompleted && (
        <NowPlayingCard roundName={selectedMatchRoundName}>
          <div className="space-y-4">
            {/* Match Display */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {participantMap.get(selectedMatch.aId!)?.name}
                  {selectedMatch.bracketSide === "grand_final" && (
                    <span className="ml-2">❤️❤️</span>
                  )}
                </p>
                {participantMap.get(selectedMatch.aId!)?.members &&
                  participantMap.get(selectedMatch.aId!)!.members!.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {participantMap
                        .get(selectedMatch.aId!)!
                        .members!.map((m) => m.name)
                        .join(" & ")}
                    </p>
                  )}
              </div>
              <span className="text-xl text-gray-400">{t("tournament.nowPlaying.vsLabel")}</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {participantMap.get(selectedMatch.bId!)?.name}
                  {selectedMatch.bracketSide === "grand_final" && <span className="ml-2">❤️</span>}
                </p>
                {participantMap.get(selectedMatch.bId!)?.members &&
                  participantMap.get(selectedMatch.bId!)!.members!.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {participantMap
                        .get(selectedMatch.bId!)!
                        .members!.map((m) => m.name)
                        .join(" & ")}
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

      {/* Regenerate Button - Consistent position with BracketView */}
      {canRegenerate && !isTournamentCompleted && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            🔀 {t("tournament.bracket.regenerate")}
          </button>
        </div>
      )}

      {/* Bracket Reset Alert - Only show when tournament is still in progress */}
      {isReset && !isTournamentCompleted && (
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

      {/* Bracket Display Container - Consistent with BracketView */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {t("tournament.doubleElim.title")}
        </h3>
        {!isTournamentCompleted && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">
            {t("tournament.bracket.clickToSelect")}
          </p>
        )}
        <div className="flex flex-col gap-8 overflow-x-auto pb-4 lg:flex-row">
          {/* LEFT: BRACKETS (on mobile: top) */}
          <div className="flex-1 space-y-6">
            {/* WINNERS BRACKET - SVG Tree Layout */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-green-700 dark:text-green-400">
                <span>🏆</span> {t("tournament.doubleElim.winnersBracket")}
                <span className="text-sm font-normal text-gray-500">
                  ({t("tournament.doubleElim.twoLives")})
                </span>
              </h3>
              <WinnersBracketSVG
                winnersMatches={winnersMatches}
                participantMap={participantMap}
                selectedMatchId={selectedMatchId}
                onSelectMatch={handleSelectMatch}
                t={t}
              />
            </div>

            {/* LOSERS BRACKET - SVG Tree Layout - Only show if there are losers rounds */}
            {losersMatches.length > 0 && (
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-red-600 dark:text-red-400">
                  <span>💔</span> {t("tournament.doubleElim.losersBracket")}
                  <span className="text-sm font-normal text-gray-500">
                    ({t("tournament.doubleElim.oneLife")})
                  </span>
                </h3>
                <LosersBracketSVG
                  losersMatches={losersMatches}
                  participantMap={participantMap}
                  selectedMatchId={selectedMatchId}
                  onSelectMatch={handleSelectMatch}
                  t={t}
                />
              </div>
            )}
          </div>

          {/* Separator line between brackets and grand final (mobile only) */}
          {grandFinalMatch && (
            <div className="my-4 h-1 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent lg:hidden" />
          )}

          {/* RIGHT: GRAND FINAL (on mobile: bottom) */}
          {grandFinalMatch && (
            <div className="flex flex-col items-center pt-2 lg:border-l-4 lg:pl-8 lg:pt-0 border-amber-400 dark:border-amber-500">
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

                {/* Connector line from Grand Final to Grand Final Reset */}
                {isReset && grandFinalResetMatch && (
                  <svg className="h-8 w-2" viewBox="0 0 8 32">
                    <path
                      d="M 4 0 V 32"
                      fill="none"
                      className={
                        grandFinalMatch.status === "completed"
                          ? "stroke-emerald-500"
                          : "stroke-gray-300 dark:stroke-gray-600"
                      }
                      strokeWidth={2}
                    />
                  </svg>
                )}

                {/* Grand Final Reset */}
                {isReset && grandFinalResetMatch && (
                  <div className="flex flex-col items-center">
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
