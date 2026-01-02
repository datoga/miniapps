"use client";

import { memo, useCallback, useEffect } from "react";
import { trackEvent, trackAppView } from "@miniapps/analytics";
import { useStats } from "../lib/useStats";
import { useTabNavigation, type Tab } from "../lib/useTabNavigation";
import { LearnTab } from "./LearnTab";
import { FindTab } from "./FindTab";
import { QuizTab } from "./QuizTab";
import { ExamTab } from "./ExamTab";
import { SongTab } from "./SongTab";
import { AppFooter } from "./AppFooter";

function MusicIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

export const VerbMasterApp = memo(function VerbMasterApp() {
  const { activeTab, changeTab } = useTabNavigation();
  const { stats, addSuccess, addFail, resetStats, removeHistoryItem } = useStats();

  // Track app view on mount
  useEffect(() => {
    trackAppView("VerbMasterPro");
  }, []);

  // Wrap changeTab with tracking
  const handleTabChange = useCallback((tab: Tab) => {
    trackEvent("tab_change", { tab });
    changeTab(tab);
  }, [changeTab]);

  const tabClasses = (tab: Tab, isSong = false) => {
    const base = "flex-1 py-3 rounded-xl font-bold transition-all";
    const active = "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400";
    const inactive = "text-slate-600 dark:text-slate-400";
    const songExtra = isSong ? " flex items-center justify-center" : "";
    return `${base} ${activeTab === tab ? active : inactive}${songExtra}`;
  };

  return (
    <div className="mx-auto max-w-md p-4 pb-32">
      {/* Header */}
      <header className="mb-6 pt-4 text-center">
        <h1 className="text-3xl font-extrabold italic tracking-tighter text-indigo-600 dark:text-indigo-400">
          Verb Master Pro 🇬🇧
        </h1>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex rounded-2xl bg-slate-200 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => handleTabChange("learn")}
          className={tabClasses("learn")}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("find")}
          className={tabClasses("find")}
        >
          Find
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("practice")}
          className={tabClasses("practice")}
        >
          Practice
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("exam")}
          className={tabClasses("exam")}
        >
          Exam
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("song")}
          className={tabClasses("song", true)}
        >
          <MusicIcon />
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "learn" && <LearnTab />}
      {activeTab === "find" && <FindTab />}
      {activeTab === "practice" && (
        <QuizTab
          stats={stats}
          onSuccess={addSuccess}
          onFail={addFail}
          onReset={resetStats}
          onRemoveHistoryItem={removeHistoryItem}
        />
      )}
      {activeTab === "exam" && <ExamTab />}
      {activeTab === "song" && <SongTab />}

      {/* Footer */}
      <AppFooter />
    </div>
  );
});

