"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tournament, Participant, Match } from "../schemas";
import * as db from "../db";
import { listTournaments, getTournament } from "../domain/tournaments";
import { getParticipantsByIds } from "../domain/participants";

interface TournamentDataState {
  tournaments: Tournament[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to manage tournament list data
 */
export function useTournamentList() {
  const [state, setState] = useState<TournamentDataState>({
    tournaments: [],
    loading: true,
    error: null,
  });

  const loadTournaments = useCallback(async () => {
    try {
      const tournaments = await listTournaments();
      setState({ tournaments, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error as Error }));
    }
  }, []);

  useEffect(() => {
    loadTournaments();

    // Subscribe to DB changes
    const unsubscribe = db.subscribeToDbChanges(() => {
      loadTournaments();
    });

    return unsubscribe;
  }, [loadTournaments]);

  return {
    ...state,
    refresh: loadTournaments,
  };
}

interface TournamentDetailState {
  tournament: Tournament | null;
  participants: Participant[];
  matches: Match[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to manage a single tournament's data
 */
export function useTournamentDetail(tournamentId: string | undefined) {
  const [state, setState] = useState<TournamentDetailState>({
    tournament: null,
    participants: [],
    matches: [],
    loading: true,
    error: null,
  });

  const loadTournament = useCallback(async () => {
    if (!tournamentId) {
      setState({ tournament: null, participants: [], matches: [], loading: false, error: null });
      return;
    }

    try {
      const tournament = await getTournament(tournamentId);
      if (!tournament) {
        setState({ tournament: null, participants: [], matches: [], loading: false, error: null });
        return;
      }

      const [participants, matches] = await Promise.all([
        getParticipantsByIds(tournament.participantIds),
        db.getMatchesForTournament(tournamentId),
      ]);

      setState({
        tournament,
        participants,
        matches,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error as Error }));
    }
  }, [tournamentId]);

  useEffect(() => {
    loadTournament();

    // Subscribe to DB changes
    const unsubscribe = db.subscribeToDbChanges(() => {
      loadTournament();
    });

    return unsubscribe;
  }, [loadTournament]);

  return {
    ...state,
    refresh: loadTournament,
  };
}

