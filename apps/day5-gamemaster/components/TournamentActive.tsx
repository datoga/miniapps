"use client";

import { ConfirmDialog } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasAnyResults, regenerateBracket } from "@/lib/domain/bracket";
import { hasAnyDoubleElimResults, regenerateDoubleElimBracket } from "@/lib/domain/doubleElim";
import { hasAnyScores } from "@/lib/domain/ladder";
import { revertToDraft } from "@/lib/domain/tournaments";
import type { Match, Participant, Tournament } from "@/lib/schemas";
import { BracketView } from "./BracketView";
import { DoubleElimBracketView } from "./DoubleElimBracketView";
import { LadderView } from "./LadderView";

interface TournamentActiveProps {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  locale: string;
}

export function TournamentActive({ tournament, participants, matches, locale }: TournamentActiveProps) {
  const t = useTranslations();
  const [canEditParticipants, setCanEditParticipants] = useState<boolean | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Regenerate state (for bracket modes)
  const [canRegenerate, setCanRegenerate] = useState<boolean | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) {return;}

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  // Check if we can edit participants and regenerate (no matches played yet)
  useEffect(() => {
    const checkCanEdit = async () => {
      let hasResults = false;

      if (tournament.mode === "ladder") {
        hasResults = await hasAnyScores(tournament.id);
      } else if (tournament.mode === "double_elim") {
        hasResults = await hasAnyDoubleElimResults(tournament.id);
      } else {
        hasResults = await hasAnyResults(tournament.id);
      }

      setCanEditParticipants(!hasResults);
      setCanRegenerate(!hasResults);
    };

    checkCanEdit();
  }, [tournament.id, tournament.mode, matches]);

  const handleRevertToDraft = async () => {
    setReverting(true);
    try {
      await revertToDraft(tournament.id);
      // The UI will refresh via the subscription
    } catch (error) {
      console.error("Failed to revert to draft:", error);
    } finally {
      setReverting(false);
      setShowEditConfirm(false);
    }
  };

  const handleRegenerate = async () => {
    setShowRegenerateConfirm(false);
    setRegenerating(true);
    try {
      if (tournament.mode === "double_elim") {
        await regenerateDoubleElimBracket(tournament.id);
      } else {
        await regenerateBracket(tournament.id);
      }
    } catch (error) {
      console.error("Failed to regenerate bracket:", error);
    } finally {
      setRegenerating(false);
    }
  };

  // Create a map for quick participant lookup
  const participantMap = new Map(participants.map((p) => [p.id, p]));


  // Confirmation Dialogs
  const confirmDialog = (
    <>
      <ConfirmDialog
        open={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        onConfirm={handleRevertToDraft}
        title={t("tournament.active.editParticipantsTitle")}
        message={t("tournament.active.editParticipantsConfirm")}
        confirmLabel={t("tournament.active.editParticipantsButton")}
        variant="warning"
        loading={reverting}
      />
      <ConfirmDialog
        open={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title={t("tournament.bracket.regenerate")}
        message={t("tournament.bracket.regenerateConfirm")}
        variant="warning"
        loading={regenerating}
      />
    </>
  );

  // Determine if we should show the toolbar (any button available)
  const isBracketMode = tournament.mode === "single_elim" || tournament.mode === "double_elim";
  const showToolbar = canEditParticipants || (isBracketMode && canRegenerate);

  // Toolbar with edit participants and regenerate buttons
  const Toolbar = showToolbar ? (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {canEditParticipants && (
          <button
            onClick={() => setShowEditConfirm(true)}
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            {t("tournament.active.editParticipants")}
          </button>
        )}
        {isBracketMode && canRegenerate && tournament.status !== "completed" && (
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={regenerating}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {regenerating ? t("common.loading") : `🔀 ${t("tournament.bracket.regenerate")}`}
          </button>
        )}
      </div>
    </div>
  ) : null;

  // Fullscreen controls shown inside fullscreen container
  const FullscreenControls = (
    <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3">
      {/* Read-only indicator */}
      <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white/90 backdrop-blur-sm">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {t("common.viewOnly")}
      </div>

      {/* Exit fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm hover:bg-black/60"
        title={t("common.exitFullscreen")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
      </button>
    </div>
  );

  if (tournament.mode === "ladder") {
    return (
      <>
        {!isFullscreen && Toolbar}
        <div ref={containerRef} className={isFullscreen ? "relative bg-white dark:bg-gray-950 overflow-auto h-screen" : ""}>
          {isFullscreen && FullscreenControls}
          <div className={isFullscreen ? "pt-14" : ""}>
            <LadderView
              tournament={tournament}
              participants={participants}
              matches={matches}
              participantMap={participantMap}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>
        </div>
        {confirmDialog}
      </>
    );
  }

  if (tournament.mode === "double_elim") {
    return (
      <>
        {!isFullscreen && Toolbar}
        <div ref={containerRef} className={isFullscreen ? "relative bg-white dark:bg-gray-950 overflow-auto h-screen" : ""}>
          {isFullscreen && FullscreenControls}
          <div className={isFullscreen ? "pt-14" : ""}>
            <DoubleElimBracketView
              tournament={tournament}
              participants={participants}
              matches={matches}
              participantMap={participantMap}
              locale={locale}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>
        </div>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      {!isFullscreen && Toolbar}
      <div ref={containerRef} className={isFullscreen ? "relative bg-white dark:bg-gray-950 overflow-auto h-screen" : ""}>
        {isFullscreen && FullscreenControls}
        <div className={isFullscreen ? "pt-14" : ""}>
          <BracketView
            tournament={tournament}
            participants={participants}
            matches={matches}
            participantMap={participantMap}
            locale={locale}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        </div>
      </div>
      {confirmDialog}
    </>
  );
}

