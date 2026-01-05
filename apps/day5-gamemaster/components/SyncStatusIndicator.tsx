"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  isGoogleConfigured,
  getProfile,
  type DriveSyncStatus,
  type GoogleProfile,
} from "@miniapps/drive";
import {
  getSyncStatus,
  subscribeToSyncStatus,
  getLastSyncedAt,
  connectDrive,
  disconnectDrive,
} from "@/lib/sync";

export function SyncStatusIndicator() {
  const t = useTranslations();
  const [status, setStatus] = useState<DriveSyncStatus>("disconnected");
  const [profile, setProfile] = useState<GoogleProfile | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load initial state and subscribe to changes
  useEffect(() => {
    setConfigured(isGoogleConfigured());
    setStatus(getSyncStatus() as DriveSyncStatus);
    setProfile(getProfile());
    setLastSyncedAt(getLastSyncedAt());

    const unsubscribe = subscribeToSyncStatus((newStatus) => {
      setStatus(newStatus as DriveSyncStatus);
      setProfile(getProfile());
      setLastSyncedAt(getLastSyncedAt());
    });
    return unsubscribe;
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectDrive();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignOut = async () => {
    setShowMenu(false);
    await disconnectDrive();
  };

  // If not configured, show a disabled state
  if (!configured) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
        title={t("drive.notConfigured")}
      >
        <GoogleIcon className="h-3.5 w-3.5 opacity-50" />
        <span className="hidden sm:inline">{t("drive.notConfiguredShort")}</span>
      </div>
    );
  }

  // Disconnected state - show connect button
  if (status === "disconnected") {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        title={t("drive.connect")}
      >
        {isConnecting ? (
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <GoogleIcon className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{t("drive.connect")}</span>
      </button>
    );
  }

  // Syncing state
  if (status === "syncing") {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="hidden sm:inline">{t("drive.status.syncing")}</span>
      </div>
    );
  }

  // Needs reconnect state
  if (status === "needs_reconnect" || status === "error") {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
        title={t("drive.reconnect")}
      >
        {isConnecting ? (
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="hidden sm:inline">{t("drive.reconnect")}</span>
      </button>
    );
  }

  // Connected state - show profile with dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
      >
        {profile?.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.pictureUrl}
            alt=""
            className="h-5 w-5 rounded-full"
          />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-200 text-[10px] font-bold text-green-700 dark:bg-green-800 dark:text-green-300">
            {profile?.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {/* Profile info */}
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {profile?.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.pictureUrl}
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200 text-lg font-bold text-green-700 dark:bg-green-800 dark:text-green-300">
                  {profile?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {profile?.name || t("drive.status.connected")}
                </p>
                {profile?.email && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-300">
                    {profile.email}
                  </p>
                )}
              </div>
            </div>
            {lastSyncedAt && (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-400">
                {t("drive.lastSync")}: {new Date(lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t("drive.disconnect")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
