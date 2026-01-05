"use client";

import { useState, useEffect, useRef } from "react";
import type { GoogleProfile, DriveSyncStatus } from "./types";

export interface SyncStatusIndicatorProps {
  /** Current sync status */
  status: DriveSyncStatus;
  /** Google profile (when connected) */
  profile?: GoogleProfile | null;
  /** Last sync timestamp */
  lastSyncedAt?: number;
  /** Handler for connect button */
  onConnect?: () => void;
  /** Handler for reconnect button */
  onReconnect?: () => void;
  /** Handler for sign out */
  onSignOut?: () => void;
  /** Whether currently connecting */
  isConnecting?: boolean;
  /** i18n translations */
  translations: {
    connect: string;
    reconnect: string;
    disconnect: string;
    statusConnected: string;
    statusSyncing: string;
    statusNeedsReconnect: string;
    statusError: string;
    lastSync: string;
    close: string;
  };
}

export function SyncStatusIndicator({
  status,
  profile,
  lastSyncedAt,
  onConnect,
  onReconnect,
  onSignOut,
  isConnecting = false,
  translations: t,
}: SyncStatusIndicatorProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSyncedTooltip, setShowSyncedTooltip] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
        setShowSyncedTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show connect button when disconnected
  if (status === "disconnected" && onConnect) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
        title={t.connect}
      >
        {isConnecting ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
        ) : (
          <GoogleIcon />
        )}
      </button>
    );
  }

  if (status === "disconnected") {
    return null;
  }

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowSyncedTooltip(false);
  };

  const handleReconnectClick = () => {
    setShowProfileMenu(false);
    onReconnect?.();
  };

  const handleSignOutClick = () => {
    setShowProfileMenu(false);
    onSignOut?.();
  };

  // Status badge component
  const StatusBadge = () => {
    const handleBadgeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (status === "connected") {
        setShowSyncedTooltip(!showSyncedTooltip);
        setShowProfileMenu(false);
      } else if (status === "needs_reconnect" || status === "error") {
        onReconnect?.();
      }
    };

    if (status === "syncing") {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-900">
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
      );
    }

    if (status === "connected") {
      return (
        <button
          onClick={handleBadgeClick}
          className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white transition-transform hover:scale-125 dark:ring-gray-900"
          title={t.statusConnected}
        >
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
        </button>
      );
    }

    if (status === "needs_reconnect" || status === "error") {
      return (
        <button
          onClick={handleBadgeClick}
          className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white transition-transform hover:scale-125 dark:ring-gray-900"
          title={t.statusNeedsReconnect}
        >
          <svg
            className="h-2 w-2 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
          </svg>
        </button>
      );
    }

    return null;
  };

  const ProfileImage = () => (
    <button
      onClick={handleProfileClick}
      className="relative rounded-full ring-2 ring-transparent transition-all hover:ring-blue-400 focus:outline-none focus:ring-blue-500"
    >
      {profile?.pictureUrl ? (
        // Use regular img tag to avoid next/image dependency issues in shared package
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.pictureUrl}
          alt={profile.name || "Profile"}
          width={28}
          height={28}
          className="rounded-full border border-gray-200 dark:border-gray-700"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {profile?.name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <StatusBadge />
    </button>
  );

  return (
    <div className="relative flex items-center gap-1" ref={menuRef}>
      <ProfileImage />

      {/* Profile menu dropdown */}
      {showProfileMenu && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {/* Profile info */}
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {profile?.name || t.statusConnected}
            </p>
            {profile?.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {profile.email}
              </p>
            )}
            {lastSyncedAt && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t.lastSync}: {new Date(lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-1 p-2">
            {(status === "needs_reconnect" || status === "error") &&
              onReconnect && (
                <button
                  onClick={handleReconnectClick}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                >
                  <RefreshIcon />
                  {t.reconnect}
                </button>
              )}
            {onSignOut && (
              <button
                onClick={handleSignOutClick}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <SignOutIcon />
                {t.disconnect}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Synced tooltip */}
      {status === "connected" && showSyncedTooltip && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-green-200 bg-white p-3 shadow-lg dark:border-green-800 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                {t.statusConnected}
              </p>
              {lastSyncedAt && (
                <>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {t.lastSync}:
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(lastSyncedAt).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSyncedTooltip(false)}
            className="mt-3 w-full rounded bg-green-100 px-2 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/50"
          >
            {t.close}
          </button>
        </div>
      )}
    </div>
  );
}

// Icon components
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}
