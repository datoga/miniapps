"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Exercise, Cycle, UserSettings, SessionPhase } from "../schemas";
import { defaultSettings } from "../schemas";
import * as db from "../db";
import type { Session } from "../schemas";
import { calculateSuggestedLoad, computeWork, estimate1RM } from "../math";
import { trackExerciseCreated, trackCycleStarted, trackCycleFinished, trackWorkoutLogged, trackPRRecorded, trackWizardCompleted, trackSettingsChanged, trackSessionUpdated } from "../ga";
import { getAccessToken, performSync } from "../drive";

export interface BilboDataState {
  settings: UserSettings;
  exercises: Exercise[];
  loading: boolean;
  initialized: boolean;
}

export interface PRDetectedInfo {
  previous1RMKg: number;
  new1RMKg: number;
  exerciseId: string;
  cycleIndex: number;
}

export function useBilboData() {
  const [state, setState] = useState<BilboDataState>({
    settings: defaultSettings,
    exercises: [],
    loading: true,
    initialized: false,
  });

  const [prDetected, setPRDetected] = useState<PRDetectedInfo | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger sync after data changes (debounced)
  const triggerSync = useCallback(async () => {
    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce sync to avoid too many calls
    syncTimeoutRef.current = setTimeout(async () => {
      const settings = await db.getSettings();
      if (settings.driveSyncEnabled && settings.driveSyncState !== "signed_out") {
        const token = getAccessToken();
        if (token) {
          try {
            const result = await performSync(token);
            // If sync completed (no conflict), state is already set by performSync
            // If there's a conflict, performSync returns it but we can't show a modal here
            // So we just mark as synced - user can manually resolve if needed
            if (result !== null) {
              // Conflict detected in auto-sync - prefer local data and mark as synced
              await db.saveSettings({ driveSyncState: "synced", lastSyncedAt: Date.now() });
            }
          } catch (error) {
            console.error("Auto-sync failed:", error);
            await db.saveSettings({ driveSyncState: "error" });
          }
        }
      }
    }, 1000); // Wait 1 second after last change before syncing
  }, []);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [settings, exercises] = await Promise.all([
          db.getSettings(),
          db.getAllExercises(),
        ]);

        // Fix stuck "syncing" state on page load
        // If state is "syncing" but there's no active sync, reset to appropriate state
        let fixedSettings = settings;
        if (settings.driveSyncState === "syncing") {
          // No sync is active on page load, reset to synced or signed_out
          const newState = settings.lastSyncedAt ? "synced" : "signed_out";
          await db.saveSettings({ driveSyncState: newState });
          fixedSettings = { ...settings, driveSyncState: newState };
        }

        setState({
          settings: fixedSettings,
          exercises,
          loading: false,
          initialized: true,
        });
      } catch (error) {
        console.error("Failed to load data:", error);
        setState((prev) => ({ ...prev, loading: false, initialized: true }));
      }
    }

    loadData();
  }, []);

  // Refresh exercises
  const refreshExercises = useCallback(async () => {
    const exercises = await db.getAllExercises();
    setState((prev) => ({ ...prev, exercises }));
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    await db.saveSettings(updates);
    const newSettings = await db.getSettings();
    setState((prev) => ({ ...prev, settings: newSettings }));
  }, []);

  // Create exercise
  const createExercise = useCallback(async (
    name: string,
    presetType: Exercise["presetType"],
    iconPresetKey: string,
    emoji?: string
  ): Promise<Exercise> => {
    const now = Date.now();
    const exercise: Exercise = {
      id: uuidv4(),
      name,
      presetType,
      iconPresetKey,
      emoji,
      createdAt: now,
      updatedAt: now,
    };

    await db.saveExercise(exercise);
    trackExerciseCreated(presetType);
    await refreshExercises();
    triggerSync();
    return exercise;
  }, [refreshExercises, triggerSync]);

  // Create cycle for exercise
  const createCycle = useCallback(async (
    exerciseId: string,
    base1RMKg: number
  ): Promise<Cycle> => {
    // Get existing cycles to determine index
    const existingCycles = await db.getCyclesForExercise(exerciseId);

    // Deactivate any active cycles
    for (const cycle of existingCycles) {
      if (cycle.isActive) {
        await db.saveCycle({ ...cycle, isActive: false, endedAt: Date.now() });
      }
    }

    const newIndex = existingCycles.length + 1;

    // Calculate start date:
    // - If first cycle: today
    // - If previous cycle exists: previous cycle's end date + 1 day
    let startedAt = Date.now();
    if (existingCycles.length > 0) {
      // Find the most recent cycle (highest index)
      const sortedCycles = [...existingCycles].sort((a, b) => b.index - a.index);
      const previousCycle = sortedCycles[0];
      if (previousCycle?.endedAt) {
        // Add 1 day (24 hours in milliseconds) to the previous cycle's end date
        startedAt = previousCycle.endedAt + 24 * 60 * 60 * 1000;
      }
    }

    const cycle: Cycle = {
      id: uuidv4(),
      exerciseId,
      index: newIndex,
      base1RMKg,
      startedAt,
      isActive: true,
    };

    await db.saveCycle(cycle);
    trackCycleStarted(exerciseId, newIndex, base1RMKg);
    triggerSync();
    return cycle;
  }, [triggerSync]);

  // Finish cycle
  const finishCycle = useCallback(async (cycleId: string): Promise<void> => {
    const cycle = await db.getCycle(cycleId);
    if (!cycle) {return;}

    const sessions = await db.getSessionsForCycle(cycleId);

    await db.saveCycle({
      ...cycle,
      isActive: false,
      endedAt: Date.now(),
    });

    trackCycleFinished(cycle.exerciseId, cycle.index, sessions.length);
    triggerSync();
  }, [triggerSync]);

  // Delete cycle
  const deleteCycle = useCallback(async (cycleId: string): Promise<void> => {
    await db.deleteCycle(cycleId);
    triggerSync();
  }, [triggerSync]);

  // Update cycle (dates, 1RM)
  const updateCycle = useCallback(async (
    cycleId: string,
    updates: { startedAt?: number; endedAt?: number | null; base1RMKg?: number }
  ): Promise<void> => {
    const cycle = await db.getCycle(cycleId);
    if (!cycle) {return;}

    await db.saveCycle({
      ...cycle,
      ...updates,
      // Convert null to undefined for endedAt (DB schema uses undefined)
      endedAt: updates.endedAt === null ? undefined : (updates.endedAt ?? cycle.endedAt),
    });
    triggerSync();
  }, [triggerSync]);

  // Get suggested load for exercise
  const getSuggestedLoad = useCallback(async (exerciseId: string): Promise<number | null> => {
    const activeCycle = await db.getActiveCycleForExercise(exerciseId);
    if (!activeCycle) {return null;}

    const sessions = await db.getSessionsForCycle(activeCycle.id);
    const lastSession = sessions.length > 0 ? sessions[0] : null; // Already sorted desc

    return calculateSuggestedLoad(
      activeCycle.base1RMKg,
      lastSession?.loadUsedKg ?? null,
      state.settings.globalIncrementKg,
      state.settings.roundStepKg
    );
  }, [state.settings.globalIncrementKg, state.settings.roundStepKg]);

  // Log session
  const logSession = useCallback(async (
    exerciseId: string,
    cycleId: string,
    date: string,
    time: string | undefined,
    loadUsedKg: number,
    reps: number,
    phase: SessionPhase,
    timeSeconds?: number,
    notes?: string
  ): Promise<Session> => {
    const cycle = await db.getCycle(cycleId);
    if (!cycle) {throw new Error("Cycle not found");}

    // Build datetime
    let datetime: string;
    if (time) {
      datetime = `${date}T${time}:00`;
    } else {
      datetime = `${date}T00:00:00`;
    }

    // Calculate suggested load
    const suggestedLoadKg = await getSuggestedLoad(exerciseId) || 0;

    const now = Date.now();
    const workKg = computeWork(loadUsedKg, reps);

    const session: Session = {
      id: uuidv4(),
      exerciseId,
      cycleId,
      phase,
      datetime,
      suggestedLoadKg,
      loadUsedKg,
      reps,
      timeSeconds,
      notes,
      workKg,
      updatedAt: now,
    };

    await db.saveSession(session);

    // Track GA event (without notes)
    trackWorkoutLogged(exerciseId, cycle.index, phase, loadUsedKg, reps);

    // Check if estimated 1RM beats previous best
    const estimated1RM = estimate1RM(loadUsedKg, reps);
    const previousBest = Math.max(cycle.base1RMKg, cycle.improved1RMKg ?? 0);

    if (estimated1RM > previousBest) {
      // New estimated 1RM!
      await db.saveCycle({
        ...cycle,
        improved1RMKg: estimated1RM,
      });

      trackPRRecorded(exerciseId, cycle.index, previousBest, estimated1RM);

      setPRDetected({
        previous1RMKg: previousBest,
        new1RMKg: estimated1RM,
        exerciseId,
        cycleIndex: cycle.index,
      });
    }

    triggerSync();
    return session;
  }, [getSuggestedLoad, triggerSync]);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    await db.deleteSession(sessionId);
    triggerSync();
  }, [triggerSync]);

  // Update session
  const updateSession = useCallback(async (
    sessionId: string,
    updates: {
      date: string;
      time?: string;
      loadUsedKg: number;
      reps: number;
      phase: SessionPhase;
      timeSeconds?: number;
      notes?: string;
    }
  ): Promise<void> => {
    const existingSession = await db.getSession(sessionId);
    if (!existingSession) {throw new Error("Session not found");}

    // Build datetime
    let datetime: string;
    if (updates.time) {
      datetime = `${updates.date}T${updates.time}:00`;
    } else {
      datetime = `${updates.date}T00:00:00`;
    }

    const workKg = computeWork(updates.loadUsedKg, updates.reps);

    const updatedSession: Session = {
      ...existingSession,
      datetime,
      loadUsedKg: updates.loadUsedKg,
      reps: updates.reps,
      phase: updates.phase,
      timeSeconds: updates.timeSeconds,
      notes: updates.notes,
      workKg,
      updatedAt: Date.now(),
    };

    await db.saveSession(updatedSession);
    trackSessionUpdated(existingSession.exerciseId);
    triggerSync();
  }, [triggerSync]);

  // Delete exercise
  const deleteExercise = useCallback(async (exerciseId: string): Promise<void> => {
    await db.deleteExercise(exerciseId);
    await refreshExercises();
    triggerSync();
  }, [refreshExercises, triggerSync]);

  // Clear PR notification
  const clearPRDetected = useCallback(() => {
    setPRDetected(null);
  }, []);

  // Get exercise detail data
  const getExerciseData = useCallback(async (exerciseId: string) => {
    const [exercise, cycles, sessions] = await Promise.all([
      db.getExercise(exerciseId),
      db.getCyclesForExercise(exerciseId),
      db.getSessionsForExercise(exerciseId),
    ]);

    const activeCycle = cycles.find((c) => c.isActive);

    return {
      exercise,
      cycles,
      sessions,
      activeCycle,
    };
  }, []);

  // Get last session for exercise
  const getLastSession = useCallback(async (exerciseId: string): Promise<Session | null> => {
    const sessions = await db.getSessionsForExercise(exerciseId);
    return sessions.length > 0 ? sessions[0] ?? null : null;
  }, []);

  // Complete first-run wizard
  const completeWizard = useCallback(async () => {
    await updateSettings({ wizardCompleted: true });
    trackWizardCompleted();
  }, [updateSettings]);

  // Clear all data
  const clearAllData = useCallback(async () => {
    await db.clearAllData();
    setState({
      settings: defaultSettings,
      exercises: [],
      loading: false,
      initialized: true,
    });
    trackSettingsChanged("clear_all_data");
  }, []);

  // Start rest period for an exercise
  const startRest = useCallback(async (
    exerciseId: string,
    startDate: string,
    endDate?: string
  ): Promise<void> => {
    const exercise = await db.getExercise(exerciseId);
    if (!exercise) {throw new Error("Exercise not found");}

    await db.saveExercise({
      ...exercise,
      isResting: true,
      restStartDate: startDate,
      restEndDate: endDate,
      updatedAt: Date.now(),
    });
    await refreshExercises();
    triggerSync();
  }, [refreshExercises, triggerSync]);

  // End rest period for an exercise
  const endRest = useCallback(async (exerciseId: string): Promise<void> => {
    const exercise = await db.getExercise(exerciseId);
    if (!exercise) {throw new Error("Exercise not found");}

    // Save to rest history if there was a rest period
    const restHistory = exercise.restHistory || [];
    const restStartDate = exercise.restStartDate;
    if (restStartDate) {
      const todayDate = new Date().toISOString().split("T")[0] as string;
      restHistory.push({
        id: uuidv4(),
        startDate: restStartDate,
        endDate: exercise.restEndDate,
        actualEndDate: todayDate,
      });
    }

    await db.saveExercise({
      ...exercise,
      isResting: false,
      restStartDate: undefined,
      restEndDate: undefined,
      restHistory,
      updatedAt: Date.now(),
    });
    await refreshExercises();
    triggerSync();
  }, [refreshExercises, triggerSync]);

  // Update rest period dates for an exercise
  const updateRest = useCallback(async (
    exerciseId: string,
    startDate: string,
    endDate?: string
  ): Promise<void> => {
    const exercise = await db.getExercise(exerciseId);
    if (!exercise) {throw new Error("Exercise not found");}

    await db.saveExercise({
      ...exercise,
      restStartDate: startDate,
      restEndDate: endDate,
      updatedAt: Date.now(),
    });
    await refreshExercises();
    triggerSync();
  }, [refreshExercises, triggerSync]);

  // Cancel/delete rest period without saving to history
  const cancelRest = useCallback(async (exerciseId: string): Promise<void> => {
    const exercise = await db.getExercise(exerciseId);
    if (!exercise) {throw new Error("Exercise not found");}

    await db.saveExercise({
      ...exercise,
      isResting: false,
      restStartDate: undefined,
      restEndDate: undefined,
      updatedAt: Date.now(),
    });
    await refreshExercises();
    triggerSync();
  }, [refreshExercises, triggerSync]);

  // Update a historical rest period
  const updateHistoricalRest = useCallback(async (
    exerciseId: string,
    restId: string,
    startDate: string,
    actualEndDate: string,
    endDate?: string
  ): Promise<void> => {
    const exercise = await db.getExercise(exerciseId);
    if (!exercise) {throw new Error("Exercise not found");}

    const restHistory = (exercise.restHistory || []).map((rest) =>
      rest.id === restId
        ? { ...rest, startDate, actualEndDate, endDate }
        : rest
    );

    await db.saveExercise({
      ...exercise,
      restHistory,
      updatedAt: Date.now(),
    });
    await refreshExercises();
    triggerSync();
  }, [refreshExercises, triggerSync]);

  // Delete a historical rest period
  const deleteHistoricalRest = useCallback(async (
    exerciseId: string,
    restId: string
  ): Promise<void> => {
    const exercise = await db.getExercise(exerciseId);
    if (!exercise) {throw new Error("Exercise not found");}

    const restHistory = (exercise.restHistory || []).filter(
      (rest) => rest.id !== restId
    );

    await db.saveExercise({
      ...exercise,
      restHistory,
      updatedAt: Date.now(),
    });
    await refreshExercises();
    triggerSync();
  }, [refreshExercises, triggerSync]);

  return {
    ...state,
    prDetected,
    refreshExercises,
    updateSettings,
    createExercise,
    createCycle,
    finishCycle,
    deleteCycle,
    updateCycle,
    getSuggestedLoad,
    logSession,
    deleteSession,
    updateSession,
    deleteExercise,
    clearPRDetected,
    getExerciseData,
    getLastSession,
    completeWizard,
    clearAllData,
    startRest,
    endRest,
    updateRest,
    cancelRest,
    updateHistoricalRest,
    deleteHistoricalRest,
  };
}

