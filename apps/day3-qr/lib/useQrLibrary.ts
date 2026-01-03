"use client";

import { useCallback, useEffect, useState } from "react";
import type { QrItem, QrPrefs, SortBy, SortDir } from "./types";
import { DEFAULT_PREFS } from "./types";
import {
  loadLibrary,
  loadPrefs,
  upsertItem,
  deleteItem as deleteItemFromStorage,
  updateName as updateNameInStorage,
  updatePref,
  saveLibrary,
} from "./storage";

interface UseQrLibraryReturn {
  items: QrItem[];
  prefs: QrPrefs;
  isLoading: boolean;
  addItem: (item: QrItem) => void;
  updateItem: (item: QrItem) => void;
  deleteItem: (id: string) => void;
  updateName: (id: string, name: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortDir: (sortDir: SortDir) => void;
  refresh: () => void;
}

/**
 * React hook for managing the QR library
 */
export function useQrLibrary(): UseQrLibraryReturn {
  const [items, setItems] = useState<QrItem[]>([]);
  const [prefs, setPrefs] = useState<QrPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    setItems(loadLibrary());
    setPrefs(loadPrefs());
    setIsLoading(false);
  }, []);

  const addItem = useCallback((item: QrItem) => {
    const updated = upsertItem(item);
    setItems(updated);
  }, []);

  const updateItem = useCallback((item: QrItem) => {
    const updated = upsertItem(item);
    setItems(updated);
  }, []);

  const deleteItem = useCallback((id: string) => {
    const updated = deleteItemFromStorage(id);
    setItems(updated);
  }, []);

  const updateName = useCallback((id: string, name: string) => {
    const updated = updateNameInStorage(id, name);
    setItems(updated);
  }, []);

  const setSortBy = useCallback((sortBy: SortBy) => {
    const updated = updatePref("sortBy", sortBy);
    setPrefs(updated);
  }, []);

  const setSortDir = useCallback((sortDir: SortDir) => {
    const updated = updatePref("sortDir", sortDir);
    setPrefs(updated);
  }, []);

  const refresh = useCallback(() => {
    setItems(loadLibrary());
    setPrefs(loadPrefs());
  }, []);

  return {
    items,
    prefs,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    updateName,
    setSortBy,
    setSortDir,
    refresh,
  };
}

// Re-export storage functions for direct use
export { loadLibrary, saveLibrary };
