"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTournamentDetail } from "@/lib/hooks/useTournamentData";
import { TournamentTV } from "@/components/TournamentTV";
import { pullFromDrive, getSyncStatus } from "@/lib/sync";

interface TournamentTVPageProps {
  locale: string;
  tournamentId: string;
}

// Polling interval: 15 seconds (to not saturate Drive API)
const POLL_INTERVAL = 15000;

export function TournamentTVPage({ locale: _locale, tournamentId }: TournamentTVPageProps) {
  const t = useTranslations();
  const { tournament, participants, matches, loading, refresh } = useTournamentDetail(tournamentId);
  const [lastSyncTime, setLastSyncTime] = useState<number | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for updates (from Drive and/or local database)
  const checkForUpdates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const status = getSyncStatus();

      // If connected to Drive, try to pull updates
      if (status === "connected") {
        const pulled = await pullFromDrive();
        if (pulled) {
          setLastSyncTime(Date.now());
        }
      }

      // Always refresh local state (catches local changes too)
      refresh();
    } catch (error) {
      console.error("Failed to check for updates:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Start polling on mount
  useEffect(() => {
    // Initial check
    checkForUpdates();

    // Set up polling interval
    pollIntervalRef.current = setInterval(checkForUpdates, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [checkForUpdates]);

  // Handle fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
      // ESC to exit (browser handles this automatically)
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-xl text-white/60">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h2 className="text-2xl font-bold text-white">Tournament not found</h2>
        </div>
      </div>
    );
  }

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  return (
    <TournamentTV
      tournament={tournament}
      participants={participants}
      matches={matches}
      participantMap={participantMap}
      lastSyncTime={lastSyncTime}
      isRefreshing={isRefreshing}
    />
  );
}

