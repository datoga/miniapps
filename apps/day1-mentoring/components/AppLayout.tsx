"use client";

import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@miniapps/ui";
import { Dashboard } from "./Dashboard";
import { LandingPage } from "./LandingPage";

// MentorFlow nav items
const mentorFlowNavItems = [
  { href: "#", labelKey: "nav.dashboard" },
  { href: "#about", labelKey: "nav.about" },
];

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

// Home icon SVG component
function HomeIcon() {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

const STORAGE_KEY = "mentorflow_entered_app";

export function AppLayout() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if user has entered app before
  useEffect(() => {
    setMounted(true);
    const hasEntered = localStorage.getItem(STORAGE_KEY);
    if (hasEntered === "true") {
      setView("dashboard");
    }
  }, []);

  const handleEnterApp = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setView("dashboard");
  }, []);

  const handleGoToLanding = useCallback(() => {
    setView("landing");
  }, []);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <AppShell navItems={mentorFlowNavItems}>
        <div className="flex h-[calc(100vh-120px)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (view === "landing") {
    return (
      <AppShell navItems={mentorFlowNavItems}>
        <LandingPage onEnterApp={handleEnterApp} />
      </AppShell>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-1">
      <button
        onClick={handleGoToLanding}
        className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Home"
      >
        <HomeIcon />
      </button>
      <button
        onClick={handleSearchOpen}
        className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Search"
      >
        <SearchIcon />
      </button>
    </div>
  );

  return (
    <AppShell navItems={mentorFlowNavItems} headerActions={headerActions}>
      <Dashboard
        searchOpen={searchOpen}
        onSearchOpen={handleSearchOpen}
        onSearchClose={handleSearchClose}
      />
    </AppShell>
  );
}

