"use client";

import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import type { Mentee } from "../lib/schemas";

interface SidebarProps {
  mentees: Mentee[];
  selectedMenteeId: string | null;
  showArchived: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectMentee: (id: string | null) => void;
  onToggleShowArchived: (show: boolean) => void;
  onNewMentee: () => void;
  onOpenBackup: () => void;
}

export const Sidebar = memo(function Sidebar({
  mentees,
  selectedMenteeId,
  showArchived,
  searchQuery,
  onSearchChange,
  onSelectMentee,
  onToggleShowArchived,
  onNewMentee,
  onOpenBackup,
}: SidebarProps) {
  const t = useTranslations();

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const handleToggleArchived = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onToggleShowArchived(e.target.checked);
    },
    [onToggleShowArchived]
  );

  return (
    <aside className="flex h-full w-72 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          {t("app.title")}
        </h1>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchInput}
          placeholder={t("dashboard.searchPlaceholder")}
          className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />

        {/* New Mentee button */}
        <Button onClick={onNewMentee} className="w-full">
          {t("dashboard.newMentee")}
        </Button>
      </div>

      {/* Mentee filter dropdown */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <select
          value={selectedMenteeId ?? "all"}
          onChange={(e) => onSelectMentee(e.target.value === "all" ? null : e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">{t("dashboard.allMentees")}</option>
          {mentees.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.archived ? "📦" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Mentee list */}
      <div className="flex-1 overflow-auto p-2">
        {mentees.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("dashboard.noMentees")}
          </div>
        ) : (
          <ul className="space-y-1">
            {mentees.map((mentee) => (
              <li key={mentee.id}>
                <button
                  onClick={() => onSelectMentee(mentee.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedMenteeId === mentee.id
                      ? "bg-primary-100 text-primary-900 dark:bg-primary-900/30 dark:text-primary-100"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{mentee.name}</span>
                    {mentee.archived && (
                      <span className="ml-2 text-xs text-gray-500">📦</span>
                    )}
                  </div>
                  {mentee.goal && (
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {mentee.goal}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        {/* Show archived toggle */}
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={handleToggleArchived}
            className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          {t("dashboard.showArchived")}
        </label>

        {/* Backup button */}
        <button
          onClick={onOpenBackup}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t("backup.title")}
        </button>
      </div>
    </aside>
  );
});

