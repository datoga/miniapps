"use client";

import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@miniapps/ui";
import { Dashboard } from "./Dashboard";
import { LandingPage } from "./LandingPage";
import { AboutSection } from "./AboutSection";

type View = "landing" | "dashboard" | "about";

// MentorFlow nav items - we'll handle clicks manually
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

const STORAGE_KEY = "mentorflow_entered_app";

// Dashboard icon
function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

// Info icon
function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function AppLayout() {
  const [view, setView] = useState<View>("landing");
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

  const handleGoToDashboard = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setView("dashboard");
  }, []);

  const handleGoToAbout = useCallback(() => {
    setView("about");
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

  // Header actions with navigation buttons
  const headerActions = (
    <div className="flex items-center gap-1">
      {view !== "dashboard" && (
        <button
          onClick={handleGoToDashboard}
          className={`rounded-lg p-2 transition-colors ${
            view === "dashboard"
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          }`}
          aria-label="Dashboard"
          title="Dashboard"
        >
          <DashboardIcon />
        </button>
      )}
      {view === "dashboard" && (
        <button
          onClick={handleSearchOpen}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Search"
          title="Search"
        >
          <SearchIcon />
        </button>
      )}
      <button
        onClick={handleGoToAbout}
        className={`rounded-lg p-2 transition-colors ${
          view === "about"
            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        }`}
        aria-label="About"
        title="About"
      >
        <InfoIcon />
      </button>
    </div>
  );

  const handleTitleClick = view === "dashboard" ? handleGoToLanding : view === "about" ? handleGoToDashboard : undefined;

  return (
    <AppShell navItems={mentorFlowNavItems} headerActions={headerActions} onTitleClick={handleTitleClick}>
      {view === "landing" && <LandingPage onEnterApp={handleEnterApp} />}
      {view === "dashboard" && (
        <Dashboard
          searchOpen={searchOpen}
          onSearchOpen={handleSearchOpen}
          onSearchClose={handleSearchClose}
        />
      )}
      {view === "about" && <AboutSection />}
    </AppShell>
  );
}

