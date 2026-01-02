"use client";

import { useState, useEffect, useCallback } from "react";

export type Tab = "learn" | "find" | "practice" | "exam" | "song";

const VALID_TABS: Tab[] = ["learn", "find", "practice", "exam", "song"];
const DEFAULT_TAB: Tab = "learn";

function getTabFromHash(): Tab {
  if (typeof window === "undefined") {
    return DEFAULT_TAB;
  }

  const hash = window.location.hash.slice(1); // Remove #
  if (VALID_TABS.includes(hash as Tab)) {
    return hash as Tab;
  }
  return DEFAULT_TAB;
}

export function useTabNavigation() {
  const [activeTab, setActiveTab] = useState<Tab>(DEFAULT_TAB);

  // Initialize from hash on mount
  useEffect(() => {
    setActiveTab(getTabFromHash());
  }, []);

  // Listen for hash changes (back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Change tab and update URL hash
  const changeTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    window.history.pushState(null, "", `#${tab}`);
  }, []);

  return { activeTab, changeTab };
}

