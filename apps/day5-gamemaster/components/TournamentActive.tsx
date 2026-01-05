"use client";
import type { Tournament, Participant, Match } from "@/lib/schemas";
import { LadderView } from "./LadderView";
import { BracketView } from "./BracketView";
import { DoubleElimBracketView } from "./DoubleElimBracketView";

interface TournamentActiveProps {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  locale: string;
}

export function TournamentActive({ tournament, participants, matches, locale }: TournamentActiveProps) {
  // Create a map for quick participant lookup
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  if (tournament.mode === "ladder") {
    return (
      <LadderView
        tournament={tournament}
        participants={participants}
        matches={matches}
        participantMap={participantMap}
      />
    );
  }

  if (tournament.mode === "double_elim") {
    return (
      <DoubleElimBracketView
        tournament={tournament}
        participants={participants}
        matches={matches}
        participantMap={participantMap}
        locale={locale}
      />
    );
  }

  return (
    <BracketView
      tournament={tournament}
      participants={participants}
      matches={matches}
      participantMap={participantMap}
      locale={locale}
    />
  );
}

