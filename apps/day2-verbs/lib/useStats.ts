"use client";

import { getJSON, setJSON, remove } from "@miniapps/storage";
import { useState, useEffect, useCallback } from "react";
import type { Verb } from "./verbData";

export interface HistoryItem {
  verb: Verb;
  status: "ok" | "fail";
}

export interface Stats {
  score: number;
  fails: number;
  total: number;
  history: HistoryItem[];
}

const STORAGE_KEY = "irregular-verbs-stats";

const defaultStats: Stats = {
  score: 0,
  fails: 0,
  total: 0,
  history: [],
};

export function useStats() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stats from storage on mount
  useEffect(() => {
    async function loadStats() {
      const saved = await getJSON<Stats>(STORAGE_KEY);
      if (saved) {
        setStats(saved);
      }
      setIsLoaded(true);
    }
    loadStats();
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    if (isLoaded) {
      setJSON(STORAGE_KEY, stats);
    }
  }, [stats, isLoaded]);

  const addSuccess = useCallback((verb: Verb) => {
    setStats((prev) => ({
      score: prev.score + 1,
      fails: prev.fails,
      total: prev.total + 1,
      history: [{ verb, status: "ok" as const }, ...prev.history].slice(0, 100),
    }));
  }, []);

  const addFail = useCallback((verb: Verb) => {
    setStats((prev) => ({
      score: prev.score,
      fails: prev.fails + 1,
      total: prev.total + 1,
      history: [{ verb, status: "fail" as const }, ...prev.history].slice(0, 100),
    }));
  }, []);

  const resetStats = useCallback(async () => {
    setStats(defaultStats);
    await remove(STORAGE_KEY);
  }, []);

  const removeHistoryItem = useCallback((index: number) => {
    setStats((prev) => {
      const item = prev.history[index];
      if (!item) { return prev; }

      const newHistory = [...prev.history];
      newHistory.splice(index, 1);

      return {
        score: item.status === "ok" ? prev.score - 1 : prev.score,
        fails: item.status === "fail" ? prev.fails - 1 : prev.fails,
        total: prev.total - 1,
        history: newHistory,
      };
    });
  }, []);

  return {
    stats,
    isLoaded,
    addSuccess,
    addFail,
    resetStats,
    removeHistoryItem,
  };
}

