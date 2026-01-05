"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Tournament, Participant, Match } from "@/lib/schemas";
import { computeLadderStandings, reportLadderScore, reorderTieGroup } from "@/lib/domain/ladder";
import { updateTournamentStatus } from "@/lib/domain/tournaments";
import { ConfirmDialog } from "./ConfirmDialog";

interface LadderViewProps {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  participantMap: Map<string, Participant>;
}

// Countdown timer presets in seconds (5m, 10m, 15m)
const TIMER_PRESETS = [300, 600, 900];
// Time extensions in seconds (+5m, +10m)
const TIME_EXTENSIONS = [300, 600];

// Local attempt type for showing recent attempts (including not-better times)
interface LocalAttempt {
  id: string;
  participantId: string;
  value: number;
  savedAt: number;
  wasBetter: boolean;
}

export function LadderView({ tournament, participants, matches, participantMap }: LadderViewProps) {
  const t = useTranslations();
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [score, setScore] = useState<string>("");
  // For time mode: separate minutes, seconds, and milliseconds inputs
  const [timeMinutes, setTimeMinutes] = useState<string>("");
  const [timeSeconds, setTimeSeconds] = useState<string>("");
  const [timeMillis, setTimeMillis] = useState<string>("000");
  const [reporting, setReporting] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [localAttempts, setLocalAttempts] = useState<LocalAttempt[]>([]);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(300); // Default 5 minutes
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ladderType = tournament.settings.ladderType || "points";
  const isTimeMode = ladderType === "time";

  const standings = computeLadderStandings(
    tournament.participantIds,
    matches,
    tournament.ladderOrder,
    ladderType
  );

  // Timer functions
  const startTimer = useCallback(() => {
    setTimerRunning(true);
    setTimerFinished(false);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerFinished(false);
    setTimeRemaining(timerDuration);
  }, [timerDuration]);

  const setPresetTime = useCallback((seconds: number) => {
    setTimerDuration(seconds);
    setTimeRemaining(seconds);
    setTimerRunning(false);
    setTimerFinished(false);
  }, []);

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
    setTimerFinished(false);
  }, []);

  const handleEndTournament = async () => {
    setEnding(true);
    try {
      await updateTournamentStatus(tournament.id, "completed");
    } catch (error) {
      console.error("Failed to end tournament:", error);
    } finally {
      setEnding(false);
      setShowEndConfirm(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timerRunning && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timerRunning && timeRemaining === 0) {
      setTimerRunning(false);
      setTimerFinished(true);
      // Play sound
      try {
        audioRef.current = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + "AAAP//" .repeat(1000));
        audioRef.current.play().catch(() => {});
      } catch {
        // Audio not supported
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timeRemaining]);

  // Format time as MM:SS (for timer display)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  const handleReport = async () => {
    if (!selectedParticipant) return;
    setReportError(null);

    let valueToReport: number;

    if (isTimeMode) {
      // Convert MM:SS:ms to total milliseconds
      const mins = parseInt(timeMinutes) || 0;
      const secs = parseInt(timeSeconds) || 0;
      const ms = parseInt(timeMillis) || 0;
      if (mins === 0 && secs === 0 && ms === 0) return;
      valueToReport = (mins * 60 + secs) * 1000 + ms;
    } else {
      if (!score) return;
      const scoreNum = parseInt(score);
      if (isNaN(scoreNum) || scoreNum < 0) return;
      valueToReport = scoreNum;
    }

    setReporting(true);
    try {
      const result = await reportLadderScore(tournament.id, selectedParticipant, valueToReport, ladderType);

      const wasBetter = result !== null;

      // Add to local attempts (for showing in "recent" section)
      const newAttempt: LocalAttempt = {
        id: `local-${Date.now()}`,
        participantId: selectedParticipant,
        value: valueToReport,
        savedAt: Date.now(),
        wasBetter,
      };
      setLocalAttempts((prev) => [newAttempt, ...prev].slice(0, 5));

      if (!wasBetter && isTimeMode) {
        // Time wasn't saved because it wasn't better
        setReportError(t("tournament.ladder.timeNotBetter"));
        // Auto-clear error after 4 seconds
        setTimeout(() => setReportError(null), 4000);
      }

      // Always reset form
      setSelectedParticipant("");
      setScore("");
      setTimeMinutes("");
      setTimeSeconds("");
      setTimeMillis("000");
    } catch (error) {
      console.error("Failed to report score:", error);
    } finally {
      setReporting(false);
    }
  };

  const handleReorder = async (participantId: string, direction: "up" | "down") => {
    await reorderTieGroup(tournament.id, participantId, direction);
  };

  // Find tie groups
  const getTieInfo = (index: number) => {
    const current = standings[index];
    if (!current) return { hasTieAbove: false, hasTieBelow: false };

    const prev = index > 0 ? standings[index - 1] : null;
    const next = index < standings.length - 1 ? standings[index + 1] : null;

    const hasTieAbove = prev && prev.score === current.score && current.hasScore && prev.hasScore;
    const hasTieBelow = next && next.score === current.score && current.hasScore && next?.hasScore;

    return { hasTieAbove, hasTieBelow };
  };

  // Get ranking position display
  const getRankDisplay = (rank: number, hasScore: boolean) => {
    if (!hasScore) return { badge: null, style: "opacity-40" };

    if (rank === 1) {
      return {
        badge: "🥇",
        style: "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-l-4 border-yellow-400",
      };
    }
    if (rank === 2) {
      return {
        badge: "🥈",
        style: "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50 border-l-4 border-gray-400",
      };
    }
    if (rank === 3) {
      return {
        badge: "🥉",
        style: "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-l-4 border-amber-600",
      };
    }
    return { badge: null, style: "" };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* Main Grid Layout: Timer+Controls on left, Ranking on right (desktop) */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* LEFT COLUMN: Timer + Score Entry (2 cols on desktop) */}
        <div className="space-y-4 lg:col-span-2">

          {/* TIMER - Hero Section */}
          <div className={`rounded-2xl p-6 shadow-lg transition-all ${
            timerFinished
              ? "animate-pulse bg-gradient-to-br from-red-500 to-red-600"
              : timerRunning
              ? "bg-gradient-to-br from-green-500 to-emerald-600"
              : "bg-gradient-to-br from-violet-600 to-purple-700"
          }`}>
            {/* Timer Display */}
            <div className="mb-4 text-center">
              <div className={`font-mono text-7xl font-black tracking-tight text-white drop-shadow-lg md:text-8xl ${
                timerFinished ? "animate-pulse" : ""
              }`}>
                {formatTime(timeRemaining)}
              </div>
              {timeRemaining <= 10 && timerRunning && !timerFinished && (
                <p className="mt-2 text-lg font-medium text-white/80">⚠️ {t("tournament.ladder.timeWarning")}</p>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex flex-wrap justify-center gap-2">
              {!timerRunning ? (
                <button
                  onClick={startTimer}
                  disabled={timeRemaining === 0}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-6 py-3 text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/30 disabled:opacity-50"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t("tournament.ladder.timerStart")}
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-6 py-3 text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  {t("tournament.ladder.timerPause")}
                </button>
              )}
              <button
                onClick={resetTimer}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Presets + Extensions */}
            <div className="mt-4 flex flex-wrap justify-center gap-1">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPresetTime(preset)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    timerDuration === preset && !timerRunning
                      ? "bg-white text-violet-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {preset < 60 ? `${preset}s` : `${preset / 60}m`}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {TIME_EXTENSIONS.map((ext) => (
                <button
                  key={ext}
                  onClick={() => addTime(ext)}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90 transition hover:bg-white/20"
                >
                  +{ext < 60 ? `${ext}s` : `${ext / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Score Entry - Compact */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h4 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
              {isTimeMode ? t("tournament.ladder.registerTime") : t("tournament.ladder.registerScore")}
            </h4>

            {/* Participant Selection */}
            <select
              value={selectedParticipant}
              onChange={(e) => {
                setSelectedParticipant(e.target.value);
                setReportError(null);
              }}
              className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{t("tournament.ladder.selectParticipant")}</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Score/Time Input */}
            {isTimeMode ? (
              <div className="mb-3 flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-1">
                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={timeMinutes}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 3);
                        setTimeMinutes(cleaned);
                        setReportError(null);
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTimeMinutes(Math.min(999, Math.max(0, val)).toString());
                      }}
                      placeholder="0"
                      className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-2xl font-bold text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">min</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-400">:</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={timeSeconds}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setTimeSeconds(cleaned);
                        setReportError(null);
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTimeSeconds(Math.min(59, Math.max(0, val)).toString().padStart(2, "0"));
                      }}
                      placeholder="00"
                      className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-2xl font-bold text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">seg</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-400">.</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={timeMillis}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 3);
                        setTimeMillis(cleaned);
                        setReportError(null);
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTimeMillis(Math.min(999, val).toString().padStart(3, "0"));
                      }}
                      placeholder="000"
                      className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-2xl font-bold text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">ms</span>
                  </div>
                </div>
              </div>
            ) : (
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                min={0}
                placeholder="0"
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-2xl font-bold text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            )}

            {/* Error message */}
            {reportError && (
              <p className="mb-2 text-center text-sm text-amber-600 dark:text-amber-400">
                {reportError}
              </p>
            )}

            {/* Report Button */}
            <button
              onClick={handleReport}
              disabled={!selectedParticipant || (isTimeMode ? ((parseInt(timeMinutes) || 0) === 0 && (parseInt(timeSeconds) || 0) === 0 && (parseInt(timeMillis) || 0) === 0) : !score) || reporting}
              className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {reporting ? t("common.loading") : (isTimeMode ? t("tournament.ladder.saveTime") : t("tournament.ladder.saveScore"))}
            </button>
          </div>

          {/* Recent Attempts - Small */}
          {localAttempts.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                {isTimeMode ? t("tournament.ladder.recentTimes") : t("tournament.ladder.recentScores")}
              </h4>
              <div className="space-y-1">
                {localAttempts.map((attempt) => {
                  const participant = participantMap.get(attempt.participantId);
                  const attemptTime = new Date(attempt.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div
                      key={attempt.id}
                      className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${
                        attempt.wasBetter
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-amber-50 dark:bg-amber-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={attempt.wasBetter ? "text-green-600" : "text-amber-600"}>
                          {attempt.wasBetter ? "✓" : "✗"}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {participant?.name || "?"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {attemptTime}
                        </span>
                      </div>
                      <span className={`font-bold ${
                        attempt.wasBetter
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {formatScoreValue(attempt.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* End Tournament - Compact */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            {t("tournament.ladder.finishTournament")}
          </button>
        </div>

        {/* RIGHT COLUMN: Live Ranking (3 cols on desktop) */}
        <div className="lg:col-span-3">
          <div className="sticky top-4 rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                🏆 {t("tournament.ladder.title")}
              </h2>
              <p className="text-center text-sm text-gray-500 dark:text-gray-300">
                {isTimeMode ? t("tournament.ladder.rankingByTime") : t("tournament.ladder.rankingByPoints")}
              </p>
            </div>

            {/* Rankings List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {standings.map((standing, index) => {
                const participant = participantMap.get(standing.participantId);
                const { hasTieAbove, hasTieBelow } = getTieInfo(index);
                const rank = standing.rank;
                const { badge, style } = getRankDisplay(rank, standing.hasScore);

                return (
                  <div
                    key={standing.participantId}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${style}`}
                  >
                    {/* Rank */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                      {badge ? (
                        <span className="text-3xl">{badge}</span>
                      ) : (
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                          standing.hasScore
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-grow">
                      <span className={`font-semibold ${
                        rank <= 3 && standing.hasScore
                          ? "text-xl text-gray-900 dark:text-white"
                          : standing.hasScore
                          ? "text-lg text-gray-700 dark:text-gray-200"
                          : "text-lg text-gray-500 dark:text-gray-300"
                      }`}>
                        {participant?.name || "Unknown"}
                      </span>
                    </div>

                    {/* Score/Time */}
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${
                        rank === 1 && standing.hasScore
                          ? "text-3xl text-yellow-600 dark:text-yellow-400"
                          : rank <= 3 && standing.hasScore
                          ? "text-2xl text-gray-900 dark:text-white"
                          : standing.hasScore
                          ? "text-xl text-gray-700 dark:text-gray-200"
                          : "text-lg text-gray-500 dark:text-gray-400"
                      }`}>
                        {standing.hasScore ? formatScoreValue(standing.score) : "-"}
                      </span>
                      {!isTimeMode && standing.hasScore && (
                        <span className="text-sm text-gray-500 dark:text-gray-300">pts</span>
                      )}
                    </div>

                    {/* Tie reorder buttons */}
                    {(hasTieAbove || hasTieBelow) && (
                      <div className="flex flex-col gap-0.5">
                        {hasTieAbove && (
                          <button
                            onClick={() => handleReorder(standing.participantId, "up")}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        )}
                        {hasTieBelow && (
                          <button
                            onClick={() => handleReorder(standing.participantId, "down")}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {standings.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-300">
                  {t("tournament.ladder.noParticipants")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* End Tournament Confirmation Modal */}
      <ConfirmDialog
        open={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleEndTournament}
        title={t("tournament.ladder.endTournament")}
        message={t("tournament.ladder.endTournamentConfirm")}
        confirmLabel={t("tournament.ladder.confirmEnd")}
        variant="danger"
        loading={ending}
      />
    </div>
  );
}
