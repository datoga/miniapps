"use client";

import { useEffect } from "react";
import { initializeSync, setupAutoPush } from "@/lib/sync";
import { loadGIS, isGoogleConfigured } from "@miniapps/drive";

interface SyncProviderProps {
  children: React.ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  useEffect(() => {
    // Skip if Google is not configured
    if (!isGoogleConfigured()) {
      return;
    }

    // Load GIS and initialize sync
    loadGIS().then(() => {
      initializeSync();
    });

    // Setup auto-push on database changes
    const unsubscribe = setupAutoPush();

    return () => {
      unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

