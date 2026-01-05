"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { initializeDb, isDataLoaded } from "@/lib/db";

interface AuthGateProps {
  children: ReactNode;
  locale: string;
}

/**
 * Simple wrapper that initializes the database before rendering children.
 * No authentication required - data is stored locally.
 */
export function AuthGate({ children }: AuthGateProps) {
  const t = useTranslations();
  const [dataReady, setDataReady] = useState(false);

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      if (!isDataLoaded()) {
        await initializeDb();
      }
      setDataReady(true);
    };

    init();
  }, []);

  // Still loading
  if (!dataReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"></div>
          <p className="text-gray-600 dark:text-gray-300">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Data loaded - render children
  return <>{children}</>;
}
