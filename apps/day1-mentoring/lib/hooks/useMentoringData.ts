"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as menteesRepo from "../repos/menteesRepo";
import * as sessionsRepo from "../repos/sessionsRepo";
import * as settingsRepo from "../repos/settingsRepo";
import type { Mentee, Session, Settings } from "../schemas";

export interface MentoringDataState {
  mentees: Mentee[];
  sessions: Session[];
  settings: Settings;
  isLoading: boolean;
  error: string | null;
}

export interface MentoringDataActions {
  // Mentee actions
  createMentee: (
    input: Parameters<typeof menteesRepo.createMentee>[0]
  ) => Promise<Mentee | null>;
  updateMentee: (
    id: string,
    input: Parameters<typeof menteesRepo.updateMentee>[1]
  ) => Promise<Mentee | null>;
  archiveMentee: (id: string) => Promise<Mentee | null>;
  unarchiveMentee: (id: string) => Promise<Mentee | null>;
  deleteMentee: (id: string) => Promise<boolean>;

  // Session actions
  createSession: (
    menteeId: string,
    input: Parameters<typeof sessionsRepo.createSession>[1]
  ) => Promise<Session | null>;
  updateSession: (
    id: string,
    input: Parameters<typeof sessionsRepo.updateSession>[1]
  ) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<boolean>;

  // Settings actions
  setSelectedMenteeId: (id: string | null) => Promise<void>;
  setShowArchived: (show: boolean) => Promise<void>;
  setProgramName: (name: string) => Promise<void>;

  // Data actions
  refresh: () => Promise<void>;
  replaceAll: (mentees: Mentee[], sessions: Session[]) => Promise<void>;
}

export function useMentoringData(): MentoringDataState & MentoringDataActions {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>({
    lastSelectedMenteeId: null,
    showArchived: false,
    programName: "Mi Programa",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [loadedMentees, loadedSessions, loadedSettings] = await Promise.all([
        menteesRepo.listMentees(),
        sessionsRepo.listAllSessions(),
        settingsRepo.getSettings(),
      ]);

      setMentees(loadedMentees);
      setSessions(loadedSessions);
      setSettings(loadedSettings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mentee actions
  const createMentee = useCallback(
    async (input: Parameters<typeof menteesRepo.createMentee>[0]) => {
      try {
        const mentee = await menteesRepo.createMentee(input);
        setMentees((prev) => [...prev, mentee]);
        return mentee;
      } catch {
        return null;
      }
    },
    []
  );

  const updateMentee = useCallback(
    async (id: string, input: Parameters<typeof menteesRepo.updateMentee>[1]) => {
      try {
        const mentee = await menteesRepo.updateMentee(id, input);
        if (mentee) {
          setMentees((prev) => prev.map((m) => (m.id === id ? mentee : m)));
        }
        return mentee;
      } catch {
        return null;
      }
    },
    []
  );

  const archiveMentee = useCallback(async (id: string) => {
    try {
      const mentee = await menteesRepo.archiveMentee(id);
      if (mentee) {
        setMentees((prev) => prev.map((m) => (m.id === id ? mentee : m)));
      }
      return mentee;
    } catch {
      return null;
    }
  }, []);

  const unarchiveMentee = useCallback(async (id: string) => {
    try {
      const mentee = await menteesRepo.unarchiveMentee(id);
      if (mentee) {
        setMentees((prev) => prev.map((m) => (m.id === id ? mentee : m)));
      }
      return mentee;
    } catch {
      return null;
    }
  }, []);

  const deleteMentee = useCallback(async (id: string) => {
    try {
      // Delete mentee and cascade delete sessions
      await sessionsRepo.deleteSessionsByMentee(id);
      const success = await menteesRepo.deleteMentee(id);
      if (success) {
        setMentees((prev) => prev.filter((m) => m.id !== id));
        setSessions((prev) => prev.filter((s) => s.menteeId !== id));
      }
      return success;
    } catch {
      return false;
    }
  }, []);

  // Session actions
  const createSession = useCallback(
    async (menteeId: string, input: Parameters<typeof sessionsRepo.createSession>[1]) => {
      try {
        const session = await sessionsRepo.createSession(menteeId, input);
        setSessions((prev) => [...prev, session]);
        return session;
      } catch {
        return null;
      }
    },
    []
  );

  const updateSession = useCallback(
    async (id: string, input: Parameters<typeof sessionsRepo.updateSession>[1]) => {
      try {
        const session = await sessionsRepo.updateSession(id, input);
        if (session) {
          setSessions((prev) => prev.map((s) => (s.id === id ? session : s)));
        }
        return session;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteSession = useCallback(async (id: string) => {
    try {
      const success = await sessionsRepo.deleteSession(id);
      if (success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
      return success;
    } catch {
      return false;
    }
  }, []);

  // Settings actions
  const setSelectedMenteeId = useCallback(async (id: string | null) => {
    await settingsRepo.setLastSelectedMenteeId(id);
    setSettings((prev) => ({ ...prev, lastSelectedMenteeId: id }));
  }, []);

  const setShowArchived = useCallback(async (show: boolean) => {
    await settingsRepo.setShowArchived(show);
    setSettings((prev) => ({ ...prev, showArchived: show }));
  }, []);

  const setProgramName = useCallback(async (name: string) => {
    await settingsRepo.setProgramName(name);
    setSettings((prev) => ({ ...prev, programName: name }));
  }, []);

  // Data actions
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const replaceAll = useCallback(async (newMentees: Mentee[], newSessions: Session[]) => {
    await menteesRepo.replaceAllMentees(newMentees);
    await sessionsRepo.replaceAllSessions(newSessions);
    setMentees(newMentees);
    setSessions(newSessions);
  }, []);

  return {
    mentees,
    sessions,
    settings,
    isLoading,
    error,
    createMentee,
    updateMentee,
    archiveMentee,
    unarchiveMentee,
    deleteMentee,
    createSession,
    updateSession,
    deleteSession,
    setSelectedMenteeId,
    setShowArchived,
    setProgramName,
    refresh,
    replaceAll,
  };
}

// Derived selectors
export function useFilteredMentees(
  mentees: Mentee[],
  showArchived: boolean,
  searchQuery: string
) {
  return useMemo(() => {
    // Filter out invalid mentees (corrupted data)
    let filtered = mentees.filter((m) => m && m.name);

    // Filter by archived status
    if (!showArchived) {
      filtered = filtered.filter((m) => !m.archived);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((m) => {
        const searchableText = [
          m.name,
          m.location,
          m.availabilityNotes,
          m.age?.toString(),
          ...(m.goals?.map((g) => g.text) || []),
          ...(m.notes?.map((n) => n.text) || []),
          ...(m.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(q);
      });
    }

    // Sort by name
    return filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [mentees, showArchived, searchQuery]);
}

export function useMenteeSessions(sessions: Session[], menteeId: string | null) {
  return useMemo(() => {
    if (!menteeId) {
      return [];
    }
    return sessions
      .filter((s) => s.menteeId === menteeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, menteeId]);
}

