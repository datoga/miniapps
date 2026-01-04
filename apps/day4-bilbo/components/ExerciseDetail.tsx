"use client";

import { useBilboData } from "@/lib/hooks/useBilboData";
import { ExerciseIcon } from "@/lib/icons";
import { format2, formatWeight, fromKg } from "@/lib/math";
import type { Cycle, Exercise, Session, UnitsUI } from "@/lib/schemas";
import { Button, Footer } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  signOut,
  signInWithGoogle,
  performSync,
  checkFirstConnectionConflict,
  resolveConflictKeepLocal,
  resolveConflictKeepRemote,
  type FirstConnectionConflict,
} from "@/lib/drive";
import { AppHeader } from "./AppHeader";
import { ConfirmDialog } from "./ConfirmDialog";
import { CycleCompletedModal } from "./CycleCompletedModal";
import { EditCycleModal } from "./EditCycleModal";
import { ExerciseCalendar } from "./ExerciseCalendar";
import { FirstConnectionConflictModal } from "./FirstConnectionConflictModal";
import { ExerciseChart } from "./ExerciseChart";
import { NewCycleModal } from "./NewCycleModal";
import { PRBanner } from "./PRBanner";
import { SessionModal } from "./SessionModal";
import { SyncStatusIndicator } from "./SyncStatusIndicator";

interface ExerciseDetailProps {
  locale: string;
  exerciseId: string;
}

export function ExerciseDetail({ locale, exerciseId }: ExerciseDetailProps) {
  const t = useTranslations();
  const router = useRouter();
  const {
    settings,
    prDetected,
    clearPRDetected,
    getExerciseData,
    getSuggestedLoad,
    finishCycle,
    createCycle,
    deleteSession,
    deleteCycle,
    updateCycle,
    deleteExercise,
    updateSettings,
  } = useBilboData();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [suggestedLoad, setSuggestedLoad] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedCycleId, setSelectedCycleId] = useState<string | "all">("all");

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [showEndCycleConfirm, setShowEndCycleConfirm] = useState(false);
  const [showCycleCompleted, setShowCycleCompleted] = useState(false);
  const [completedCycleData, setCompletedCycleData] = useState<{
    cycleIndex: number;
    sessionCount: number;
    startDate: string;
    endDate: string;
    initial1RMKg: number;
    final1RMKg: number;
    totalWorkKg: number;
  } | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteCycleId, setDeleteCycleId] = useState<string | null>(null);
  const [showDeleteExerciseConfirm, setShowDeleteExerciseConfirm] = useState(false);
  const [editingCycleFromCalendar, setEditingCycleFromCalendar] = useState<Cycle | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [firstConnectionConflict, setFirstConnectionConflict] = useState<{
    conflict: FirstConnectionConflict;
    token: string;
  } | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  const [activeTab, setActiveTab] = useState<"history" | "calendar" | "charts">("history");

  const loadData = useCallback(async () => {
    const data = await getExerciseData(exerciseId);
    if (data.exercise) {
      setExercise(data.exercise);
      setCycles(data.cycles.sort((a, b) => b.index - a.index));
      setSessions(data.sessions);
      setActiveCycle(data.activeCycle || null);

      const suggested = await getSuggestedLoad(exerciseId);
      setSuggestedLoad(suggested);
    }
    setLoading(false);
  }, [exerciseId, getExerciseData, getSuggestedLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (selectedCycleId !== "all" && s.cycleId !== selectedCycleId) {
      return false;
    }
    return true;
  });

  // Build timeline with cycle markers
  type TimelineEvent =
    | { type: "session"; session: Session }
    | { type: "cycle-start"; cycle: Cycle; timestamp: number }
    | { type: "cycle-end"; cycle: Cycle; timestamp: number };

  // Helper to get cycle dates from sessions
  const getCycleDates = useCallback(
    (cycle: Cycle) => {
      const cycleSessions = sessions.filter((s) => s.cycleId === cycle.id);
      if (cycleSessions.length === 0) {
        // No sessions, use current date
        return { startDate: Date.now(), endDate: cycle.endedAt ? Date.now() : null };
      }
      // Sort sessions by datetime
      const sorted = [...cycleSessions].sort((a, b) => a.datetime.localeCompare(b.datetime));
      const firstSession = sorted[0];
      const lastSession = sorted[sorted.length - 1];
      const startDate = firstSession ? new Date(firstSession.datetime).getTime() : Date.now();
      const endDate =
        cycle.endedAt && lastSession ? new Date(lastSession.datetime).getTime() : null;
      return { startDate, endDate };
    },
    [sessions]
  );

  const timeline = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add sessions
    filteredSessions.forEach((s) => {
      events.push({ type: "session", session: s });
    });

    // Add cycle events - dates derived from sessions
    // If filtering by cycle, only show events for that cycle
    const cyclesToShow =
      selectedCycleId !== "all" ? cycles.filter((c) => c.id === selectedCycleId) : cycles;

    cyclesToShow.forEach((c) => {
      const { startDate, endDate } = getCycleDates(c);
      events.push({ type: "cycle-start", cycle: c, timestamp: startDate });
      if (c.endedAt && endDate) {
        events.push({ type: "cycle-end", cycle: c, timestamp: endDate });
      }
    });

    // Sort by datetime/timestamp descending (newest first)
    // cycle-start should appear AFTER (below) all sessions in that cycle
    // cycle-end should appear BEFORE (above) all sessions in that cycle
    events.sort((a, b) => {
      // Get sortable value for each event
      const getSortKey = (e: TimelineEvent): string => {
        if (e.type === "session") {
          // Use datetime string directly (ISO format sorts correctly)
          return e.session.datetime;
        }
        // For cycle-start, position just before the oldest session
        if (e.type === "cycle-start") {
          const cycleSessions = filteredSessions.filter((s) => s.cycleId === e.cycle.id);
          const sortedSessions = [...cycleSessions].sort((x, y) =>
            x.datetime.localeCompare(y.datetime)
          );
          const oldest = sortedSessions[0];
          if (oldest) {
            // Add "A" suffix to sort just before the session (A < T in ASCII)
            return oldest.datetime.replace("T", "A");
          }
          return new Date(e.timestamp).toISOString().slice(0, 19);
        }
        // For cycle-end, position just after the newest session
        // e.type === "cycle-end"
        const cycleSessions = filteredSessions.filter((s) => s.cycleId === e.cycle.id);
        const sortedSessions = [...cycleSessions].sort((x, y) =>
          y.datetime.localeCompare(x.datetime)
        );
        const newest = sortedSessions[0];
        if (newest) {
          // Add "Z" suffix to sort just after the session (Z > T in ASCII)
          return newest.datetime.replace("T", "Z");
        }
        return new Date(e.timestamp).toISOString().slice(0, 19);
      };
      return getSortKey(b).localeCompare(getSortKey(a));
    });

    return events;
  }, [filteredSessions, cycles, selectedCycleId, getCycleDates]);

  // Check if this is the first session of the active cycle
  const sessionsInActiveCycle = activeCycle
    ? sessions.filter((s) => s.cycleId === activeCycle.id)
    : [];
  const isFirstSessionOfCycle = sessionsInActiveCycle.length === 0;
  // Bilbo is completed when any session in the cycle had <15 reps
  const hasBilboCompleted = sessionsInActiveCycle.some((s) => s.reps < 15);
  // Calculate minimum reps in cycle (for warning message)
  const minRepsInCycle =
    sessionsInActiveCycle.length > 0 ? Math.min(...sessionsInActiveCycle.map((s) => s.reps)) : null;

  const handleFinishCycleClick = () => {
    if (!activeCycle) {
      return;
    }
    // Show confirmation dialog
    setShowEndCycleConfirm(true);
  };

  const handleConfirmEndCycle = async () => {
    if (!activeCycle) {
      return;
    }

    // Collect cycle stats before finishing
    const cycleSessions = sessions.filter((s) => s.cycleId === activeCycle.id);
    const sessionCount = cycleSessions.length;
    const startDate = new Date(activeCycle.startedAt).toISOString().split("T")[0] as string;
    const endDate = new Date().toISOString().split("T")[0] as string;
    const initial1RMKg = activeCycle.base1RMKg;

    // Calculate final 1RM (best estimated 1RM in cycle)
    const final1RMKg =
      cycleSessions.length > 0
        ? Math.max(
            ...cycleSessions.map((s) => {
              const reps = s.reps;
              const load = s.loadUsedKg;
              return load * (1 + reps / 30);
            })
          )
        : initial1RMKg;

    // Calculate total work
    const totalWorkKg = cycleSessions.reduce((sum, s) => sum + s.loadUsedKg * s.reps, 0);

    // Store cycle data for the completed modal
    setCompletedCycleData({
      cycleIndex: activeCycle.index,
      sessionCount,
      startDate,
      endDate,
      initial1RMKg,
      final1RMKg,
      totalWorkKg,
    });

    // Close the cycle
    await finishCycle(activeCycle.id);
    setShowEndCycleConfirm(false);
    // Reload data
    await loadData();
    // Show cycle completed modal (instead of what next modal)
    setShowCycleCompleted(true);
  };

  const handleCloseCycleCompleted = () => {
    setShowCycleCompleted(false);
    setCompletedCycleData(null);
  };

  const handleNewCycleSave = async (base1RMKg: number) => {
    await createCycle(exerciseId, base1RMKg);
    setShowNewCycleModal(false);
    loadData();
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) {
      return;
    }
    await deleteSession(deleteSessionId);
    setDeleteSessionId(null);
    loadData();
  };

  const handleDeleteCycle = async () => {
    if (!deleteCycleId) {
      return;
    }
    await deleteCycle(deleteCycleId);
    setDeleteCycleId(null);
    loadData();
  };

  const handleDeleteExercise = async () => {
    await deleteExercise(exerciseId);
    setShowDeleteExerciseConfirm(false);
    router.push(`/${locale}/app`);
  };

  const handleSaveCycleEdit = async (updates: {
    startedAt?: number;
    endedAt?: number | null;
    base1RMKg?: number;
  }) => {
    if (editingCycleFromCalendar) {
      await updateCycle(editingCycleFromCalendar.id, updates);
      setEditingCycleFromCalendar(null);
      loadData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    await updateSettings({
      driveSyncEnabled: false,
      driveSyncState: "signed_out",
      driveProfile: undefined,
      lastSyncedAt: undefined,
    });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        // Check for first connection conflict
        const conflictCheck = await checkFirstConnectionConflict(result.token);

        if (conflictCheck) {
          setFirstConnectionConflict({ conflict: conflictCheck, token: result.token });
          await updateSettings({
            driveSyncEnabled: true,
            driveSyncState: "syncing",
            driveProfile: result.profile,
          });
        } else {
          await updateSettings({
            driveSyncEnabled: true,
            driveSyncState: "synced",
            driveProfile: result.profile,
          });
          const syncResult = await performSync(result.token);
          // If conflict during sync, just mark as synced (performSync set state to syncing)
          if (syncResult) {
            await updateSettings({ driveSyncState: "synced", lastSyncedAt: Date.now() });
          } else {
            await updateSettings({ lastSyncedAt: Date.now() });
          }
        }
      }
    } catch (error) {
      console.error("Connect error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConflictKeepLocal = async () => {
    if (!firstConnectionConflict) {
      return;
    }
    setIsResolvingConflict(true);
    try {
      const success = await resolveConflictKeepLocal(firstConnectionConflict.token);
      if (success) {
        await updateSettings({ driveSyncState: "synced", lastSyncedAt: Date.now() });
      } else {
        await updateSettings({ driveSyncState: "error" });
      }
    } catch (error) {
      console.error("Error keeping local:", error);
      await updateSettings({ driveSyncState: "error" });
    } finally {
      setFirstConnectionConflict(null);
      setIsResolvingConflict(false);
    }
  };

  const handleConflictKeepRemote = async () => {
    if (!firstConnectionConflict) {
      return;
    }
    setIsResolvingConflict(true);
    try {
      const success = await resolveConflictKeepRemote(
        firstConnectionConflict.conflict.remoteBackup
      );
      if (success) {
        await updateSettings({ driveSyncState: "synced", lastSyncedAt: Date.now() });
        loadData(); // Refresh data after importing
      } else {
        await updateSettings({ driveSyncState: "error" });
      }
    } catch (error) {
      console.error("Error keeping remote:", error);
      await updateSettings({ driveSyncState: "error" });
    } finally {
      setFirstConnectionConflict(null);
      setIsResolvingConflict(false);
    }
  };

  const handleConflictCancel = async () => {
    await signOut();
    setFirstConnectionConflict(null);
  };

  if (loading || !exercise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-pulse">🏋️</div>
          <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      {prDetected && (
        <PRBanner
          previous1RMKg={prDetected.previous1RMKg}
          new1RMKg={prDetected.new1RMKg}
          unitsUI={settings.unitsUI}
          onDismiss={clearPRDetected}
        />
      )}

      <AppHeader
        locale={locale}
        showBackButton
        backHref={`/${locale}/app`}
        title={exercise.name}
        currentPath="exercise"
        rightContent={
          <SyncStatusIndicator
            state={settings.driveSyncState}
            profile={settings.driveProfile}
            lastSyncedAt={settings.lastSyncedAt}
            onConnect={handleConnect}
            isConnecting={isConnecting}
            onSignOut={handleSignOut}
          />
        }
      />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-3">
              {/* Left side: Icon, name, cycle info */}
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 md:h-16 md:w-16 dark:bg-red-950 dark:text-red-400">
                  <ExerciseIcon
                    iconPresetKey={exercise.iconPresetKey}
                    emoji={exercise.emoji}
                    className="h-7 w-7 text-2xl md:h-10 md:w-10 md:text-3xl"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
                    {exercise.name}
                  </h1>
                  {activeCycle && (
                    <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {t("home.cycle")} {activeCycle.index}
                      </span>
                      {suggestedLoad !== null && (
                        <span className="ml-2">
                          · {t("home.nextSuggested")}:{" "}
                          <strong className="text-red-600 dark:text-red-400">
                            {formatWeight(suggestedLoad, settings.unitsUI)}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: 1RM Display */}
              {activeCycle && (
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {/* Base 1RM Card */}
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-white">
                    <span className="text-sm">🎯</span>
                    <span className="text-[10px] font-medium uppercase opacity-80">1RM</span>
                    <span className="text-sm font-bold">
                      {formatWeight(activeCycle.base1RMKg, settings.unitsUI)}
                    </span>
                  </div>

                  {/* New Estimated 1RM Card */}
                  {activeCycle.improved1RMKg &&
                    activeCycle.improved1RMKg > activeCycle.base1RMKg && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-white">
                        <span className="text-sm">📈</span>
                        <span className="text-[10px] font-medium uppercase opacity-80">
                          {t("rm.new")}
                        </span>
                        <span className="text-sm font-bold">
                          {formatWeight(activeCycle.improved1RMKg, settings.unitsUI)}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6 flex flex-wrap gap-2">
            {activeCycle && (
              <Button variant="primary" onClick={() => setShowSessionModal(true)}>
                <span className="md:hidden">✏️</span>
                <span className="hidden md:inline">✏️ {t("home.logSession")}</span>
              </Button>
            )}
            {activeCycle && !isFirstSessionOfCycle && (
              <Button variant="outline" onClick={handleFinishCycleClick}>
                <span className="md:hidden">🏁</span>
                <span className="hidden md:inline">🏁 {t("exercise.endCycle")}</span>
              </Button>
            )}
            {!activeCycle && (
              <Button variant="outline" onClick={() => setShowNewCycleModal(true)}>
                <span className="md:hidden">🔄</span>
                <span className="hidden md:inline">🔄 {t("exercise.startNewCycle")}</span>
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-4 flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "history"
                  ? "border-b-2 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {t("exercise.history")}
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "calendar"
                  ? "border-b-2 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {t("exercise.calendar")}
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "charts"
                  ? "border-b-2 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {t("exercise.charts")}
            </button>
          </div>

          {activeTab === "history" && (
            <>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {/* Quick Filter Pills */}
                <div className="flex items-center gap-1.5">
                  {/* All */}
                  <button
                    onClick={() => setSelectedCycleId("all")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCycleId === "all"
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {t("exercise.filters.all")}
                  </button>

                  {/* Current Cycle (if exists) */}
                  {activeCycle && (
                    <button
                      onClick={() => setSelectedCycleId(activeCycle.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedCycleId === activeCycle.id
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {t("exercise.filters.current")}
                    </button>
                  )}

                  {/* First Cycle (oldest, index 1) */}
                  {cycles.length > 0 && cycles.find((c) => c.index === 1) && (
                    <button
                      onClick={() => {
                        const firstCycle = cycles.find((c) => c.index === 1);
                        if (firstCycle) {
                          setSelectedCycleId(firstCycle.id);
                        }
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedCycleId === cycles.find((c) => c.index === 1)?.id
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      C1
                    </button>
                  )}
                </div>

                {/* Cycle Dropdown (for all cycles) */}
                {cycles.length > 1 && (
                  <select
                    value={selectedCycleId}
                    onChange={(e) => setSelectedCycleId(e.target.value)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="all">{t("exercise.filters.all")}</option>
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t("home.cycle")} {c.index}{" "}
                        {c.isActive ? `(${t("exercise.filters.current")})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sessions Table */}
              {filteredSessions.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-gray-600 dark:text-gray-400">{t("exercise.noSessions")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                          {t("exercise.table.date")}
                        </th>
                        <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                          {t("exercise.table.load")}
                        </th>
                        <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                          {t("exercise.table.reps")}
                        </th>
                        <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                          {t("exercise.table.work")}
                        </th>
                        <th className="px-2 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                          {t("exercise.table.phase")}
                        </th>
                        <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400" />
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((event) => {
                        if (event.type === "session") {
                          return (
                            <SessionRow
                              key={event.session.id}
                              session={event.session}
                              unitsUI={settings.unitsUI}
                              onEdit={() => setEditingSession(event.session)}
                              onDelete={() => setDeleteSessionId(event.session.id)}
                            />
                          );
                        }
                        if (event.type === "cycle-start") {
                          return (
                            <tr
                              key={`cycle-start-${event.cycle.id}`}
                              className="bg-green-50 dark:bg-green-950/30"
                            >
                              <td colSpan={6} className="px-2 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <span className="text-lg">🚀</span>
                                    <span className="font-medium">
                                      {t("exercise.timeline.cycleStarted", {
                                        number: event.cycle.index,
                                      })}
                                    </span>
                                    <span className="text-xs text-green-600 dark:text-green-500">
                                      <span className="md:hidden">
                                        {new Date(event.timestamp).toLocaleDateString(undefined, {
                                          day: "numeric",
                                          month: "numeric",
                                        })}
                                      </span>
                                      <span className="hidden md:inline">
                                        {new Date(event.timestamp).toLocaleDateString()}
                                      </span>
                                      {" · 1RM: "}
                                      {formatWeight(event.cycle.base1RMKg, settings.unitsUI)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setDeleteCycleId(event.cycle.id)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title={t("common.delete")}
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        if (event.type === "cycle-end") {
                          return (
                            <tr
                              key={`cycle-end-${event.cycle.id}`}
                              className="bg-amber-50 dark:bg-amber-950/30"
                            >
                              <td colSpan={6} className="px-2 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                    <span className="text-lg">🏁</span>
                                    <span className="font-medium">
                                      {t("exercise.timeline.cycleEnded", {
                                        number: event.cycle.index,
                                      })}
                                    </span>
                                    <span className="text-xs text-amber-600 dark:text-amber-500">
                                      <span className="md:hidden">
                                        {new Date(event.timestamp).toLocaleDateString(undefined, {
                                          day: "numeric",
                                          month: "numeric",
                                        })}
                                      </span>
                                      <span className="hidden md:inline">
                                        {new Date(event.timestamp).toLocaleDateString()}
                                      </span>
                                      {event.cycle.improved1RMKg && (
                                        <>
                                          {" "}
                                          · 1RM:{" "}
                                          {formatWeight(
                                            event.cycle.improved1RMKg,
                                            settings.unitsUI
                                          )}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setDeleteCycleId(event.cycle.id)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title={t("common.delete")}
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return null;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "calendar" && (
            <ExerciseCalendar
              sessions={sessions}
              cycles={cycles}
              unitsUI={settings.unitsUI}
              onEditSession={(session) => {
                setEditingSession(session);
                setShowSessionModal(true);
              }}
              onDeleteSession={(sessionId) => setDeleteSessionId(sessionId)}
              onEditCycle={(cycle) => {
                setEditingCycleFromCalendar(cycle);
              }}
              onDeleteCycle={(cycleId) => setDeleteCycleId(cycleId)}
            />
          )}

          {activeTab === "charts" && (
            <ExerciseChart sessions={sessions} cycles={cycles} unitsUI={settings.unitsUI} />
          )}

          {/* Danger Zone - Delete Exercise */}
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <h3 className="mb-1 font-semibold text-red-800 dark:text-red-300">
              {t("exercise.dangerZone")}
            </h3>
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {t("exercise.deleteDescription")}
            </p>
            <button
              onClick={() => setShowDeleteExerciseConfirm(true)}
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
            >
              🗑️ {t("exercise.deleteButton")}
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Session Modal (Create) */}
      {showSessionModal && activeCycle && (
        <SessionModal
          isOpen
          onClose={() => setShowSessionModal(false)}
          exercise={exercise}
          cycle={activeCycle}
          suggestedLoadKg={suggestedLoad || 0}
          unitsUI={settings.unitsUI}
          hasBilboCompleted={hasBilboCompleted}
          previousSession={(() => {
            const prev = sessionsInActiveCycle[0];
            return prev ? { reps: prev.reps, loadUsedKg: prev.loadUsedKg } : null;
          })()}
          onSave={() => {
            setShowSessionModal(false);
            loadData();
          }}
          onBilboCompletedEndCycle={async () => {
            setShowSessionModal(false);

            // Collect cycle stats before finishing
            const cycleSessions = sessions.filter((s) => s.cycleId === activeCycle.id);
            const sessionCount = cycleSessions.length + 1; // +1 for the session just saved
            const startDate = new Date(activeCycle.startedAt).toISOString().split("T")[0] as string;
            const endDate = new Date().toISOString().split("T")[0] as string;
            const initial1RMKg = activeCycle.base1RMKg;
            const final1RMKg = activeCycle.improved1RMKg || activeCycle.base1RMKg;
            const totalWorkKg = cycleSessions.reduce((sum, s) => sum + s.workKg, 0);

            await finishCycle(activeCycle.id);
            await loadData();

            // Show cycle completed modal with share option
            setCompletedCycleData({
              cycleIndex: activeCycle.index,
              sessionCount,
              startDate,
              endDate,
              initial1RMKg,
              final1RMKg,
              totalWorkKg,
            });
            setShowCycleCompleted(true);
          }}
        />
      )}

      {/* Session Modal (Edit) */}
      {editingSession && (
        <SessionModal
          isOpen
          onClose={() => setEditingSession(null)}
          exercise={exercise}
          cycle={cycles.find((c) => c.id === editingSession.cycleId) || activeCycle!}
          suggestedLoadKg={editingSession.suggestedLoadKg}
          unitsUI={settings.unitsUI}
          editSession={editingSession}
          onSave={() => {
            setEditingSession(null);
            loadData();
          }}
          onBilboCompletedEndCycle={() => {
            // This is only called for new sessions, not edits
            setEditingSession(null);
          }}
        />
      )}

      {/* End Cycle Confirm */}
      <ConfirmDialog
        isOpen={showEndCycleConfirm}
        onClose={() => setShowEndCycleConfirm(false)}
        onConfirm={handleConfirmEndCycle}
        title={t("cycle.endCycleTitle")}
        message={
          !hasBilboCompleted && minRepsInCycle !== null
            ? t("cycle.endCycleWarningBilbo", { minReps: minRepsInCycle })
            : t("cycle.endCycleMessage")
        }
        confirmLabel={t("cycle.endCycleConfirm")}
        variant={!hasBilboCompleted && minRepsInCycle !== null ? "danger" : "warning"}
      />

      {/* Cycle Completed Modal with Share */}
      {showCycleCompleted && completedCycleData && exercise && (
        <CycleCompletedModal
          isOpen
          onClose={handleCloseCycleCompleted}
          exerciseName={exercise.name}
          cycleIndex={completedCycleData.cycleIndex}
          sessionCount={completedCycleData.sessionCount}
          startDate={completedCycleData.startDate}
          endDate={completedCycleData.endDate}
          initial1RMKg={completedCycleData.initial1RMKg}
          final1RMKg={completedCycleData.final1RMKg}
          totalWorkKg={completedCycleData.totalWorkKg}
          unitsUI={settings.unitsUI}
        />
      )}

      {/* New Cycle Modal */}
      {showNewCycleModal && (
        <NewCycleModal
          isOpen
          onClose={() => setShowNewCycleModal(false)}
          onSave={handleNewCycleSave}
          unitsUI={settings.unitsUI}
          previousCycle={cycles.length > 0 ? cycles[0] : undefined}
        />
      )}

      {/* Delete Session Confirm */}
      <ConfirmDialog
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={handleDeleteSession}
        title={t("common.delete")}
        message={t("session.deleteConfirm")}
        variant="danger"
      />

      {/* Delete Cycle Confirm */}
      <ConfirmDialog
        isOpen={!!deleteCycleId}
        onClose={() => setDeleteCycleId(null)}
        onConfirm={handleDeleteCycle}
        title={t("common.delete")}
        message={t("cycle.deleteConfirm")}
        variant="danger"
      />

      {/* Edit Cycle Modal */}
      {editingCycleFromCalendar && (
        <EditCycleModal
          isOpen
          onClose={() => setEditingCycleFromCalendar(null)}
          onSave={handleSaveCycleEdit}
          cycle={editingCycleFromCalendar}
          unitsUI={settings.unitsUI}
        />
      )}

      {/* Delete Exercise Confirm */}
      <ConfirmDialog
        isOpen={showDeleteExerciseConfirm}
        onClose={() => setShowDeleteExerciseConfirm(false)}
        onConfirm={handleDeleteExercise}
        title={t("exercise.deleteTitle")}
        message={t("exercise.deleteMessage")}
        confirmLabel={t("common.delete")}
        variant="danger"
      />

      {/* First Connection Conflict Modal */}
      {firstConnectionConflict && (
        <FirstConnectionConflictModal
          conflict={firstConnectionConflict.conflict}
          onKeepLocal={handleConflictKeepLocal}
          onKeepRemote={handleConflictKeepRemote}
          onCancel={handleConflictCancel}
          isLoading={isResolvingConflict}
        />
      )}
    </div>
  );
}

interface SessionRowProps {
  session: Session;
  unitsUI: UnitsUI;
  onEdit: () => void;
  onDelete: () => void;
}

function SessionRow({ session, unitsUI, onEdit, onDelete }: SessionRowProps) {
  const t = useTranslations();
  const date = new Date(session.datetime);
  const dateStrFull = date.toLocaleDateString(); // With year for desktop
  const dateStrShort = date.toLocaleDateString(undefined, { day: "numeric", month: "numeric" }); // Without year for mobile
  const hasTime = !session.datetime.endsWith("T00:00:00");
  const timeStr = hasTime
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="px-2 py-3 text-gray-900 dark:text-white">
        <span className="md:hidden">{dateStrShort}</span>
        <span className="hidden md:inline">{dateStrFull}</span>
        {timeStr && <span className="ml-1 text-xs text-gray-500 md:ml-2">{timeStr}</span>}
      </td>
      <td className="px-2 py-3 text-right font-mono text-gray-900 dark:text-white">
        {formatWeight(session.loadUsedKg, unitsUI)}
      </td>
      <td className="px-2 py-3 text-right text-gray-900 dark:text-white">{session.reps}</td>
      <td className="px-2 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
        {format2(fromKg(session.workKg, unitsUI))}
      </td>
      <td className="px-2 py-3 text-center">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            session.phase === "bilbo"
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          }`}
        >
          {session.phase === "bilbo" ? t("session.phaseBilbo") : t("session.phaseStrength")}
        </span>
      </td>
      <td className="px-2 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            title={t("common.edit")}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title={t("common.delete")}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
