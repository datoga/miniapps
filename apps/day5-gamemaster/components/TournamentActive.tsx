"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Tournament, Participant, Match } from "@/lib/schemas";
import { LadderView } from "./LadderView";
import { BracketView } from "./BracketView";
import { DoubleElimBracketView } from "./DoubleElimBracketView";
import { ConfirmDialog } from "./ConfirmDialog";
import { hasAnyResults } from "@/lib/domain/bracket";
import { hasAnyDoubleElimResults } from "@/lib/domain/doubleElim";
import { hasAnyScores } from "@/lib/domain/ladder";
import { revertToDraft } from "@/lib/domain/tournaments";

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

  // Check if we can edit participants (no matches played yet)
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

  // Create a map for quick participant lookup
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  // Edit Participants Button (shown when no matches played)
  const EditParticipantsButton = canEditParticipants ? (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <button
        onClick={() => setShowEditConfirm(true)}
        className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        {t("tournament.active.editParticipants")}
      </button>
    </div>
  ) : null;

  // Confirmation Dialog
  const confirmDialog = (
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
  );

  if (tournament.mode === "ladder") {
    return (
      <>
        {EditParticipantsButton}
        <LadderView
          tournament={tournament}
          participants={participants}
          matches={matches}
          participantMap={participantMap}
        />
        {confirmDialog}
      </>
    );
  }

  if (tournament.mode === "double_elim") {
    return (
      <>
        {EditParticipantsButton}
        <DoubleElimBracketView
          tournament={tournament}
          participants={participants}
          matches={matches}
          participantMap={participantMap}
          locale={locale}
        />
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      {EditParticipantsButton}
      <BracketView
        tournament={tournament}
        participants={participants}
        matches={matches}
        participantMap={participantMap}
        locale={locale}
      />
      {confirmDialog}
    </>
  );
}

