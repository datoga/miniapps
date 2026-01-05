"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Tournament } from "@/lib/schemas";
import { archiveTournament, unarchiveTournament, deleteTournament } from "@/lib/domain/tournaments";
import { ConfirmDialog } from "./ConfirmDialog";
import { getGameEmoji } from "@/lib/games";

interface TournamentCardProps {
  tournament: Tournament;
  locale: string;
  basePath?: string;
  onUpdate?: () => void;
}

export function TournamentCard({ tournament, locale, basePath = "", onUpdate }: TournamentCardProps) {
  const t = useTranslations();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const statusColors = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const modeIcons = {
    single_elim: "🏆",
    double_elim: "❤️❤️",
    ladder: "📊",
  };

  // Get game emoji (game takes precedence over mode icon)
  const gameEmoji = tournament.game
    ? getGameEmoji(tournament.game.gameKey, tournament.game.customEmoji)
    : null;

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
  };

  const getDateDisplay = (): string | null => {
    if (!tournament.startDate) return null;

    if (tournament.endDate && tournament.endDate !== tournament.startDate) {
      return `${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`;
    }
    return formatDate(tournament.startDate);
  };

  const dateDisplay = getDateDisplay();

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (tournament.archived) {
        await unarchiveTournament(tournament.id);
      } else {
        await archiveTournament(tournament.id);
      }
      onUpdate?.();
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await deleteTournament(tournament.id);
      onUpdate?.();
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className="relative">
      <Link
        href={`/${locale}${basePath}/t/${tournament.id}`}
        className={`block rounded-lg border p-4 transition-shadow hover:shadow-md ${
          tournament.archived
            ? "border-gray-300 bg-gray-100 opacity-70 dark:border-gray-700 dark:bg-gray-800/50"
            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{gameEmoji || modeIcons[tournament.mode]}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{tournament.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {dateDisplay && (
                  <>
                    <span className="inline-flex items-center gap-1">
                      📅 {dateDisplay}
                    </span>
                    {" • "}
                  </>
                )}
                {t("dashboard.mode." + tournament.mode)} •{" "}
                {t("dashboard.participants", { count: tournament.participantIds.length })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tournament.archived && (
              <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {t("dashboard.archived")}
              </span>
            )}
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[tournament.status]}`}>
              {t("dashboard.status." + tournament.status)}
            </span>
            {/* Menu button */}
            <button
              onClick={toggleMenu}
              className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              disabled={loading}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </Link>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              setShowMenu(false);
            }}
          />
          <div className="absolute right-0 top-12 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={handleArchive}
              disabled={loading}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span>{tournament.archived ? "📤" : "📥"}</span>
              {tournament.archived ? t("dashboard.unarchive") : t("dashboard.archive")}
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={loading}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <span>🗑️</span>
              {t("dashboard.delete")}
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title={t("dashboard.deleteTitle")}
        message={t("dashboard.deleteConfirm")}
        confirmLabel={t("dashboard.deleteConfirmButton")}
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
