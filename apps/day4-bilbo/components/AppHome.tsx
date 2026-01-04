"use client";

import * as db from "@/lib/db";
import {
  signOut,
  signInWithGoogle,
  performSync,
  checkFirstConnectionConflict,
  resolveConflictKeepLocal,
  resolveConflictKeepRemote,
  type FirstConnectionConflict,
} from "@/lib/drive";
import { useBilboData } from "@/lib/hooks/useBilboData";
import { ExerciseIcon } from "@/lib/icons";
import { formatWeight } from "@/lib/math";
import type { Cycle, Exercise, Session } from "@/lib/schemas";
import { Button, Footer } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddExerciseModal } from "./AddExerciseModal";
import { AppHeader } from "./AppHeader";
import { FirstConnectionConflictModal } from "./FirstConnectionConflictModal";
import { FirstRunWizard } from "./FirstRunWizard";
import { PRBanner } from "./PRBanner";
import { SessionModal } from "./SessionModal";
import { SyncStatusIndicator } from "./SyncStatusIndicator";

interface AppHomeProps {
  locale: string;
}

interface ExerciseCardData {
  exercise: Exercise;
  activeCycle: Cycle | null;
  lastSession: Session | null;
  suggestedLoad: number | null;
  hasBilboCompleted: boolean;
  previousSessionInCycle: { reps: number; loadUsedKg: number } | null;
}

export function AppHome({ locale }: AppHomeProps) {
  const t = useTranslations();
  const router = useRouter();
  const {
    settings,
    exercises,
    loading,
    initialized,
    prDetected,
    clearPRDetected,
    updateSettings,
    createExercise,
    createCycle,
    finishCycle,
    getSuggestedLoad,
    getLastSession,
    completeWizard,
    refreshExercises,
  } = useBilboData();

  const [exerciseCards, setExerciseCards] = useState<ExerciseCardData[]>([]);
  const [sessionModalExercise, setSessionModalExercise] = useState<ExerciseCardData | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [firstConnectionConflict, setFirstConnectionConflict] = useState<{
    conflict: FirstConnectionConflict;
    token: string;
  } | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  // Load exercise card data
  const loadExerciseCards = useCallback(async () => {
    if (exercises.length === 0) {
      setExerciseCards([]);
      setLoadingCards(false);
      return;
    }

    const cards = await Promise.all(
      exercises.map(async (exercise) => {
        const cycles = await db.getCyclesForExercise(exercise.id);
        const activeCycle = cycles.find((c) => c.isActive) || null;
        const lastSession = await getLastSession(exercise.id);
        const suggestedLoad = await getSuggestedLoad(exercise.id);

        // Check sessions in active cycle to determine Bilbo completion and previous session
        let hasBilboCompleted = false;
        let previousSessionInCycle: { reps: number; loadUsedKg: number } | null = null;
        if (activeCycle) {
          const sessions = await db.getSessionsForExercise(exercise.id);
          const cycleSessions = sessions.filter((s) => s.cycleId === activeCycle.id);
          // Bilbo is completed when any session had <15 reps
          hasBilboCompleted = cycleSessions.some((s) => s.reps < 15);
          // Get most recent session in cycle for reference
          const firstSession = cycleSessions[0];
          if (firstSession) {
            previousSessionInCycle = {
              reps: firstSession.reps,
              loadUsedKg: firstSession.loadUsedKg,
            };
          }
        }

        return {
          exercise,
          activeCycle,
          lastSession,
          suggestedLoad,
          hasBilboCompleted,
          previousSessionInCycle,
        };
      })
    );

    setExerciseCards(cards);
    setLoadingCards(false);
  }, [exercises, getSuggestedLoad, getLastSession]);

  useEffect(() => {
    if (initialized && !loading) {
      loadExerciseCards();
    }
  }, [initialized, loading, loadExerciseCards]);

  // Handle wizard completion
  const handleWizardComplete = async (data: {
    unitsUI: "kg" | "lb";
    globalIncrementKg: number;
    exerciseName: string;
    presetType: Exercise["presetType"];
    iconPresetKey: string;
    emoji?: string;
    base1RMKg: number;
  }) => {
    // Save settings (roundStepKg = globalIncrementKg for simplicity)
    await updateSettings({
      unitsUI: data.unitsUI,
      globalIncrementKg: data.globalIncrementKg,
      roundStepKg: data.globalIncrementKg,
    });

    // Create exercise
    const exercise = await createExercise(
      data.exerciseName,
      data.presetType,
      data.iconPresetKey,
      data.emoji
    );

    // Create first cycle
    await createCycle(exercise.id, data.base1RMKg);

    // Mark wizard as complete
    await completeWizard();

    // Refresh data
    await refreshExercises();
    loadExerciseCards();
  };

  const handleSessionSaved = () => {
    setSessionModalExercise(null);
    loadExerciseCards();
  };

  const handleAddExercise = async (data: {
    exerciseName: string;
    presetType: Exercise["presetType"];
    iconPresetKey: string;
    emoji?: string;
    base1RMKg: number;
  }) => {
    // Create exercise
    const exercise = await createExercise(
      data.exerciseName,
      data.presetType,
      data.iconPresetKey,
      data.emoji
    );

    // Create first cycle
    await createCycle(exercise.id, data.base1RMKg);

    // Close modal and refresh
    setShowAddExercise(false);
    await refreshExercises();
    loadExerciseCards();
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        // Check for first connection conflict (both local and remote have data)
        const conflictCheck = await checkFirstConnectionConflict(result.token);

        if (conflictCheck) {
          // Show conflict resolution modal
          setFirstConnectionConflict({ conflict: conflictCheck, token: result.token });
          // Save profile but don't complete sync yet
          await updateSettings({
            driveSyncEnabled: true,
            driveSyncState: "syncing",
            driveProfile: result.profile,
          });
        } else {
          // No conflict - proceed with normal sync
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
        // Refresh data after importing
        await refreshExercises();
        loadExerciseCards();
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
    // Cancel connection - sign out
    await signOut();
    setFirstConnectionConflict(null);
  };

  if (loading || !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-pulse">🏋️</div>
          <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Show wizard if not completed and no exercises
  if (!settings.wizardCompleted && exercises.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <AppHeader locale={locale} currentPath="app" />
        <main className="flex-1">
          <FirstRunWizard onComplete={handleWizardComplete} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      {/* PR Banner */}
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
        currentPath="app"
        rightContent={
          <SyncStatusIndicator
            state={settings.driveSyncState}
            profile={settings.driveProfile}
            lastSyncedAt={settings.lastSyncedAt}
            onConnect={handleConnect}
            isConnecting={isConnecting}
            onSignOut={async () => {
              await signOut();
              await updateSettings({
                driveSyncEnabled: false,
                driveSyncState: "signed_out",
                driveProfile: undefined,
                lastSyncedAt: undefined,
              });
            }}
          />
        }
      />

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("home.title")}</h1>
          </div>

          {/* Exercise Cards */}
          {loadingCards && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          )}
          {!loadingCards && exerciseCards.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 text-4xl">📋</div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("home.empty.title")}
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">{t("home.empty.description")}</p>
              <Button variant="primary" onClick={() => setShowAddExercise(true)}>
                {t("home.addExercise")}
              </Button>
            </div>
          )}
          {!loadingCards && exerciseCards.length > 0 && (
            <div className="space-y-4">
              {exerciseCards.map((card) => (
                <ExerciseCard
                  key={card.exercise.id}
                  card={card}
                  locale={locale}
                  unitsUI={settings.unitsUI}
                  onLogSession={() => setSessionModalExercise(card)}
                />
              ))}
              {/* Add exercise button */}
              <button
                onClick={() => setShowAddExercise(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                <span className="text-xl">➕</span>
                <span className="font-medium">{t("home.addExercise")}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Session Modal */}
      {sessionModalExercise && sessionModalExercise.activeCycle && (
        <SessionModal
          isOpen
          onClose={() => setSessionModalExercise(null)}
          exercise={sessionModalExercise.exercise}
          cycle={sessionModalExercise.activeCycle}
          suggestedLoadKg={sessionModalExercise.suggestedLoad || 0}
          unitsUI={settings.unitsUI}
          onSave={handleSessionSaved}
          onBilboCompletedEndCycle={async () => {
            // End cycle and navigate to exercise detail for "what next" options
            const exerciseId = sessionModalExercise.exercise.id;
            const cycleId = sessionModalExercise.activeCycle!.id;
            setSessionModalExercise(null);
            await finishCycle(cycleId);
            // Navigate to exercise detail page where user can start new cycle or rest
            router.push(`/${locale}/app/exercise/${exerciseId}`);
          }}
          hasBilboCompleted={sessionModalExercise.hasBilboCompleted}
          previousSession={sessionModalExercise.previousSessionInCycle}
        />
      )}

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onSave={handleAddExercise}
        unitsUI={settings.unitsUI}
        existingExerciseNames={exercises.map((e) => e.name)}
        isFirstExercise={exercises.length === 0}
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

interface ExerciseCardProps {
  card: ExerciseCardData;
  locale: string;
  unitsUI: "kg" | "lb";
  onLogSession: () => void;
}

function ExerciseCard({ card, locale, unitsUI, onLogSession }: ExerciseCardProps) {
  const t = useTranslations();
  const { exercise, activeCycle, lastSession, suggestedLoad } = card;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <ExerciseIcon
            iconPresetKey={exercise.iconPresetKey}
            emoji={exercise.emoji}
            className="h-8 w-8 text-2xl"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate">
              {exercise.name}
            </h2>
            {activeCycle && (
              <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {t("home.cycle")} {activeCycle.index}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            {suggestedLoad !== null && (
              <span>
                {t("home.nextSuggested")}:{" "}
                <strong className="text-red-600 dark:text-red-400">
                  {formatWeight(suggestedLoad, unitsUI)}
                </strong>
              </span>
            )}
            {lastSession && (
              <span>
                {t("home.lastSession")}: {formatWeight(lastSession.loadUsedKg, unitsUI)} ×{" "}
                {lastSession.reps}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {activeCycle && (
          <Button variant="primary" size="sm" className="flex-1" onClick={onLogSession}>
            <span className="md:hidden">✏️</span>
            <span className="hidden md:inline">✏️ {t("home.logSession")}</span>
          </Button>
        )}
        <Link
          href={`/${locale}/app/exercise/${exercise.id}`}
          className={activeCycle ? "flex-1" : "w-full"}
        >
          <Button variant="outline" size="sm" className="w-full">
            <span className="md:hidden">👁️</span>
            <span className="hidden md:inline">👁️ {t("home.viewDetails")}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
