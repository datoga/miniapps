"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@miniapps/ui";
import { Dashboard } from "./Dashboard";

// No nav items for MentorFlow - clean header
const mentorFlowNavItems: { href: string; labelKey: string }[] = [];

export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const searchButton = (
    <button
      onClick={handleSearchOpen}
      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label="Search"
    >
      🔍
    </button>
  );

  return (
    <AppShell navItems={mentorFlowNavItems} headerActions={searchButton}>
      <Dashboard
        searchOpen={searchOpen}
        onSearchOpen={handleSearchOpen}
        onSearchClose={handleSearchClose}
      />
    </AppShell>
  );
}

