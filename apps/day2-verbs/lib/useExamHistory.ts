"use client";

import { getJSON, setJSON } from "@miniapps/storage";
import { useState, useEffect, useCallback } from "react";

export interface ExamResult {
  id: string;
  date: string;
  correct: number;
  incorrect: number;
  total: number;
  timeUsed: number; // in seconds
  timeLimit: number; // in seconds
  categories: string[];
}

const STORAGE_KEY = "irregular-verbs-exam-history";

export function useExamHistory() {
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from storage on mount
  useEffect(() => {
    async function loadHistory() {
      const saved = await getJSON<ExamResult[]>(STORAGE_KEY);
      if (saved) {
        setHistory(saved);
      }
      setIsLoaded(true);
    }
    loadHistory();
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (isLoaded) {
      setJSON(STORAGE_KEY, history);
    }
  }, [history, isLoaded]);

  const addExamResult = useCallback((result: Omit<ExamResult, "id" | "date">) => {
    const newResult: ExamResult = {
      ...result,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setHistory((prev) => [newResult, ...prev].slice(0, 50));
    return newResult;
  }, []);

  const removeExamResult = useCallback((id: string) => {
    setHistory((prev) => prev.filter((exam) => exam.id !== id));
  }, []);

  const resetExamHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    isLoaded,
    addExamResult,
    removeExamResult,
    resetExamHistory,
  };
}

