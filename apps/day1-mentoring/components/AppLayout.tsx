"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@miniapps/ui";
import { Dashboard } from "./Dashboard";

// No nav items for MentorFlow - clean header
const mentorFlowNavItems: { href: string; labelKey: string }[] = [];

// Search icon SVG component
function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

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
      <SearchIcon />
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

