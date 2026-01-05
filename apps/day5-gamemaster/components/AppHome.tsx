"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Footer } from "@miniapps/ui";
import { AppHeader } from "./AppHeader";
import { AuthGate } from "./AuthGate";
import { CreateTournamentModal } from "./CreateTournamentModal";
import { TournamentCard } from "./TournamentCard";
import { useTournamentList } from "@/lib/hooks/useTournamentData";
import { getAllParticipants } from "@/lib/db";

interface AppHomeProps {
  locale: string;
}

function AppHomeContent({ locale }: AppHomeProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { tournaments, loading, refresh } = useTournamentList();

  // Filter tournaments based on archived status
  const filteredTournaments = useMemo(() => {
    if (showArchived) {
      return tournaments; // Show all
    }
    return tournaments.filter((t) => !t.archived);
  }, [tournaments, showArchived]);

  // Count archived
  const archivedCount = useMemo(() => {
    return tournaments.filter((t) => t.archived).length;
  }, [tournaments]);

  const handleTournamentCreated = (tournamentId: string) => {
    router.push(`/${locale}/app/t/${tournamentId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-pulse">🏆</div>
          <p className="text-gray-600 dark:text-gray-300">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <AppHeader locale={locale} currentPath="app" />

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("dashboard.title")}
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">{t("dashboard.createTournament")}</span>
            </button>
          </div>

          {/* Archive filter toggle */}
          {archivedCount > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
              >
                <span>{showArchived ? "📥" : "📤"}</span>
                {showArchived ? t("dashboard.hideArchived") : t("dashboard.showArchived")}
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
                  {archivedCount}
                </span>
              </button>
            </div>
          )}

          {/* Tournament Cards */}
          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          )}

          {!loading && filteredTournaments.length === 0 && !showArchived && tournaments.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 text-4xl">🏆</div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("dashboard.empty.title")}
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                {t("dashboard.empty.description")}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t("dashboard.createTournament")}
              </button>
            </div>
          )}

          {!loading && filteredTournaments.length === 0 && !showArchived && tournaments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 text-4xl">📥</div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {t("dashboard.empty.title")}
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                {t("dashboard.showArchived")} ({archivedCount})
              </p>
              <button
                onClick={() => setShowArchived(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("dashboard.showArchived")}
              </button>
            </div>
          )}

          {!loading && filteredTournaments.length > 0 && (
            <div className="space-y-4">
              {filteredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  locale={locale}
                  basePath="/app"
                  onUpdate={refresh}
                />
              ))}
            </div>
          )}

          {/* Data Stats Card */}
          {!loading && (
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                📊 {t("settings.data.title")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-center dark:bg-gray-900">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {tournaments.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t("settings.data.tournaments")}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-center dark:bg-gray-900">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {getAllParticipants().length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t("settings.data.participants")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleTournamentCreated}
      />
    </div>
  );
}

// Main export with AuthGate wrapper
export function AppHome({ locale }: AppHomeProps) {
  return (
    <AuthGate locale={locale}>
      <AppHomeContent locale={locale} />
    </AuthGate>
  );
}
