"use client";

import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AppShell, ModalLabelsWrapper } from "@miniapps/ui";
import { SearchModal } from "./SearchModal";
import { useMentoringData } from "../lib/hooks/useMentoringData";

type CurrentPath = "landing" | "dashboard" | "mentee-detail" | "about";

interface AppShellWrapperProps {
  children: ReactNode;
  currentPath: CurrentPath;
}

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

export function AppShellWrapper({ children, currentPath }: AppShellWrapperProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [searchOpen, setSearchOpen] = useState(false);

  // Load data for search
  const data = useMentoringData();

  const navigateTo = useCallback((path: string) => {
    router.push(`/${locale}${path}`);
  }, [router, locale]);

  const handleTitleClick = useCallback(() => {
    if (currentPath === "landing") {return;}
    navigateTo("");
  }, [currentPath, navigateTo]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const handleSelectMentee = useCallback((menteeId: string | null) => {
    setSearchOpen(false);
    if (menteeId) {
      navigateTo(`/dashboard/${menteeId}`);
    } else {
      navigateTo("/dashboard");
    }
  }, [navigateTo]);

  // Header actions with navigation buttons
  const headerActions = (
    <div className="flex items-center gap-1">
      {currentPath !== "dashboard" && currentPath !== "mentee-detail" && (
        <button
          onClick={() => navigateTo("/dashboard")}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Dashboard"
          title="Dashboard"
        >
          <DashboardIcon />
        </button>
      )}
      {(currentPath === "dashboard" || currentPath === "mentee-detail") && (
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
        onClick={() => navigateTo("/about")}
        className={`rounded-lg p-2 transition-colors ${
          currentPath === "about"
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

  return (
    <ModalLabelsWrapper t={t}>
      <AppShell
        navItems={[]}
        headerActions={headerActions}
        onTitleClick={currentPath !== "landing" ? handleTitleClick : undefined}
      >
        {children}
      </AppShell>

      {/* Search Modal - available on dashboard and mentee detail */}
      <SearchModal
        open={searchOpen}
        mentees={data.mentees}
        sessions={data.sessions}
        showArchived={data.settings.showArchived}
        onSelectMentee={handleSelectMentee}
        onClose={handleSearchClose}
      />
    </ModalLabelsWrapper>
  );
}

