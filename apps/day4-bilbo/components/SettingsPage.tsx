"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Footer } from "@miniapps/ui";
import { AppHeader } from "./AppHeader";
import { Modal } from "./Modal";
import { SyncStatusIndicator } from "./SyncStatusIndicator";
import { useBilboData } from "@/lib/hooks/useBilboData";
import { fromKg, toKg, format2 } from "@/lib/math";
import { trackSettingsChanged } from "@/lib/ga";
import {
  signInWithGoogle,
  signOut,
  performSync,
  getAccessToken,
  deleteBackupFromDrive,
  checkFirstConnectionConflict,
  resolveConflictKeepLocal,
  resolveConflictKeepRemote,
  type FirstConnectionConflict,
} from "@/lib/drive";
import type { DriveProfile, DriveSyncState } from "@/lib/schemas";
import { FirstConnectionConflictModal } from "./FirstConnectionConflictModal";

interface SettingsPageProps {
  locale: string;
}

export function SettingsPage({ locale }: SettingsPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { settings, loading, updateSettings, clearAllData } = useBilboData();

  const [unitsUI, setUnitsUI] = useState(settings.unitsUI);
  const [increment, setIncrement] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBackupToo, setDeleteBackupToo] = useState(true);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnectDeleteBackup, setDisconnectDeleteBackup] = useState(false);

  // Google Drive sync state
  const [syncState, setSyncState] = useState<DriveSyncState>(
    settings.driveSyncState || "signed_out"
  );
  const [syncProfile, setSyncProfile] = useState<DriveProfile | undefined>(settings.driveProfile);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | undefined>(settings.lastSyncedAt);
  const [firstConnectionConflict, setFirstConnectionConflict] = useState<{
    conflict: FirstConnectionConflict;
    token: string;
  } | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  // Initialize values when settings load
  useEffect(() => {
    if (!loading) {
      setUnitsUI(settings.unitsUI);
      setIncrement(format2(fromKg(settings.globalIncrementKg, settings.unitsUI)));
    }
  }, [loading, settings]);

  // Update increment display when units change
  useEffect(() => {
    if (!loading) {
      setIncrement(format2(fromKg(settings.globalIncrementKg, unitsUI)));
    }
  }, [unitsUI, settings.globalIncrementKg, loading]);

  // Update sync state from settings
  useEffect(() => {
    if (!loading) {
      setSyncState(settings.driveSyncState || "signed_out");
      setSyncProfile(settings.driveProfile);
      setLastSynced(settings.lastSyncedAt);
    }
  }, [loading, settings.driveSyncState, settings.driveProfile, settings.lastSyncedAt]);

  const handleUnitsChange = async (newUnits: "kg" | "lb") => {
    setUnitsUI(newUnits);
    await updateSettings({ unitsUI: newUnits });
    trackSettingsChanged("units");
  };

  const handleIncrementChange = async (value: string) => {
    const num = parseFloat(value);
    // Only allow positive numbers or empty string
    if (value === "" || (!isNaN(num) && num >= 0)) {
      setIncrement(value);
      if (!isNaN(num) && num > 0) {
        const kg = toKg(num, unitsUI);
        // Also update roundStepKg to match
        await updateSettings({ globalIncrementKg: kg, roundStepKg: kg });
        trackSettingsChanged("increment");
      }
    }
  };

  const handleDeleteAllData = async () => {
    // If connected to Google Drive and user wants to delete backup too
    if (syncState !== "signed_out" && deleteBackupToo) {
      const accessToken = getAccessToken();
      if (accessToken) {
        try {
          await deleteBackupFromDrive(accessToken);
        } catch (error) {
          console.error("Error deleting backup from Drive:", error);
        }
      }
      await signOut();
    }

    // Clear all local data
    await clearAllData();
    setShowDeleteConfirm(false);
    router.push(`/${locale}`);
  };

  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setSyncProfile(result.profile);
        trackSettingsChanged("sync");

        // Check for first connection conflict
        const conflictCheck = await checkFirstConnectionConflict(result.token);

        if (conflictCheck) {
          // Show conflict resolution modal
          setFirstConnectionConflict({ conflict: conflictCheck, token: result.token });
          setSyncState("syncing");
          await updateSettings({
            driveSyncEnabled: true,
            driveSyncState: "syncing",
            driveProfile: result.profile,
          });
        } else {
          // No conflict - proceed with sync
          setSyncState("synced");
          await updateSettings({
            driveSyncEnabled: true,
            driveSyncState: "synced",
            driveProfile: result.profile,
          });

          const syncResult = await performSync(result.token);
          if (!syncResult) {
            // Success - no conflict
            setLastSynced(Date.now());
            await updateSettings({ lastSyncedAt: Date.now() });
          } else {
            // Conflict during sync - just mark as synced
            // (performSync already set state to syncing, reset it)
            setSyncState("synced");
            setLastSynced(Date.now());
            await updateSettings({ driveSyncState: "synced", lastSyncedAt: Date.now() });
          }
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setSyncState("error");
    } finally {
      setIsSyncing(false);
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
        setSyncState("synced");
        setLastSynced(Date.now());
        await updateSettings({ driveSyncState: "synced", lastSyncedAt: Date.now() });
      } else {
        setSyncState("error");
        await updateSettings({ driveSyncState: "error" });
      }
    } catch (error) {
      console.error("Error keeping local:", error);
      setSyncState("error");
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
        setSyncState("synced");
        setLastSynced(Date.now());
        await updateSettings({ driveSyncState: "synced", lastSyncedAt: Date.now() });
        // Reload page to refresh data
        window.location.reload();
      } else {
        setSyncState("error");
        await updateSettings({ driveSyncState: "error" });
      }
    } catch (error) {
      console.error("Error keeping remote:", error);
      setSyncState("error");
      await updateSettings({ driveSyncState: "error" });
    } finally {
      setFirstConnectionConflict(null);
      setIsResolvingConflict(false);
    }
  };

  const handleConflictCancel = async () => {
    await signOut();
    setSyncProfile(undefined);
    setSyncState("signed_out");
    setFirstConnectionConflict(null);
  };

  const handleGoogleSignOut = async () => {
    await signOut();
    setSyncProfile(undefined);
    setSyncState("signed_out");
    setLastSynced(undefined);
    await updateSettings({
      driveSyncEnabled: false,
      driveSyncState: "signed_out",
      driveProfile: undefined,
      lastSyncedAt: undefined,
    });
    trackSettingsChanged("sync");
  };

  const handleManualSync = async () => {
    const token = getAccessToken();
    if (!token) {
      setSyncState("error");
      return;
    }

    setIsSyncing(true);
    setSyncState("syncing");
    try {
      // null result means success (no conflict)
      const result = await performSync(token);
      setSyncState("synced");
      setLastSynced(Date.now());
      await updateSettings({
        driveSyncState: "synced",
        lastSyncedAt: Date.now(),
      });
      // If there's a conflict, we'd handle it here (but for now we just sync)
      if (result) {
        console.log("Sync conflict detected:", result);
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncState("error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    // If user wants to delete backup too
    if (disconnectDeleteBackup) {
      const accessToken = getAccessToken();
      if (accessToken) {
        try {
          await deleteBackupFromDrive(accessToken);
        } catch (error) {
          console.error("Error deleting backup from Drive:", error);
        }
      }
    }

    // Sign out
    await signOut();
    setSyncProfile(undefined);
    setSyncState("signed_out");
    setLastSynced(undefined);
    await updateSettings({
      driveSyncEnabled: false,
      driveSyncState: "signed_out",
      driveProfile: undefined,
      lastSyncedAt: undefined,
    });
    trackSettingsChanged("sync");
    setShowDisconnectConfirm(false);
    setDisconnectDeleteBackup(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-pulse">⚙️</div>
          <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <AppHeader
        locale={locale}
        showBackButton
        backHref={`/${locale}/app`}
        title={t("settings.title")}
        currentPath="settings"
        rightContent={
          <SyncStatusIndicator
            state={syncState}
            profile={syncProfile}
            lastSyncedAt={lastSynced}
            onConnect={handleGoogleSignIn}
            isConnecting={isSyncing}
            onSignOut={handleGoogleSignOut}
          />
        }
      />

      <main className="flex-1">
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="space-y-6">
            {/* Units */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                {t("settings.units.title")}
              </h3>
              <div className="flex gap-2">
                {(["kg", "lb"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleUnitsChange(unit)}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${
                      unitsUI === unit
                        ? "border-red-600 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950 dark:text-red-300"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {t(`settings.units.${unit}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Increment */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                {t("settings.increment.title")}
              </h3>
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                {t("settings.increment.description")}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={increment}
                  onChange={(e) => handleIncrementChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {unitsUI}
                </span>
              </div>
            </div>

            {/* Cloud Backup - Google Drive */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t("settings.sync.title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("settings.sync.description")}
                </p>
              </div>

              {syncState === "signed_out" ? (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSyncing}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-50 dark:border-blue-600 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                  {isSyncing ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  ) : (
                    <>
                      {/* Google "G" Icon */}
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {t("settings.sync.signIn")}
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Connected profile */}
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                    <div className="flex items-center gap-3">
                      {/* Profile image (non-interactive) */}
                      <div className="relative">
                        {syncProfile?.pictureUrl ? (
                          <img
                            src={syncProfile.pictureUrl}
                            alt={syncProfile.name || "Profile"}
                            className="h-8 w-8 rounded-full border border-green-200 dark:border-green-700"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-200 text-sm font-medium text-green-700 dark:bg-green-800 dark:text-green-300">
                            {syncProfile?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        {/* Sync status badge */}
                        {syncState === "synced" && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-green-50 dark:ring-green-950">
                            <svg
                              className="h-2 w-2 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                        {syncState === "syncing" && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-green-50 dark:ring-green-950">
                            <svg
                              className="h-2 w-2 animate-spin text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          </div>
                        )}
                        {syncState === "error" && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-green-50 dark:ring-green-950">
                            <svg
                              className="h-2 w-2 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          {syncProfile?.name || syncProfile?.email}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {lastSynced ? (
                            <>
                              {t("settings.sync.lastSynced")}:{" "}
                              {new Date(lastSynced).toLocaleString()}
                            </>
                          ) : (
                            t("settings.sync.status.synced")
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
                      title={t("settings.sync.syncNow")}
                    >
                      {isSyncing ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Disconnect button */}
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    {t("settings.sync.disconnect")}
                  </button>
                </div>
              )}

              {syncState === "error" && (
                <p className="mt-2 text-center text-xs text-red-500">
                  {t("settings.sync.status.error")}
                </p>
              )}
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <h3 className="mb-1 font-semibold text-red-800 dark:text-red-300">
                {t("settings.danger.title")}
              </h3>
              <p className="mb-3 text-sm text-red-600 dark:text-red-400">
                {t("settings.danger.deleteAll.description")}
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
              >
                🗑️ {t("settings.danger.deleteAll.button")}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Delete All Data Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteBackupToo(true);
        }}
        title={t("settings.danger.deleteAll.confirmTitle")}
        size="sm"
      >
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {t("settings.danger.deleteAll.confirmMessage")}
        </p>

        {/* Checkbox to delete backup - only shown if connected */}
        {syncState !== "signed_out" && (
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <input
              type="checkbox"
              checked={deleteBackupToo}
              onChange={(e) => setDeleteBackupToo(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("settings.danger.deleteAll.deleteBackupToo")}
            </span>
          </label>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteBackupToo(true);
            }}
            className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleDeleteAllData}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            {t("common.delete")}
          </button>
        </div>
      </Modal>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={showDisconnectConfirm}
        onClose={() => {
          setShowDisconnectConfirm(false);
          setDisconnectDeleteBackup(false);
        }}
        title={t("settings.sync.disconnectConfirmTitle")}
        size="sm"
      >
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {t("settings.sync.disconnectConfirmMessage")}
        </p>

        {/* Checkbox to delete backup */}
        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <input
            type="checkbox"
            checked={disconnectDeleteBackup}
            onChange={(e) => setDisconnectDeleteBackup(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t("settings.sync.disconnectDeleteBackupOption")}
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowDisconnectConfirm(false);
              setDisconnectDeleteBackup(false);
            }}
            className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleDisconnect}
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            {t("settings.sync.disconnect")}
          </button>
        </div>
      </Modal>

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
