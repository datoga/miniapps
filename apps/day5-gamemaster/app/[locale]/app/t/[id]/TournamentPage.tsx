"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Footer } from "@miniapps/ui";
import { AppHeader } from "@/components/AppHeader";
import { AuthGate } from "@/components/AuthGate";
import { useTournamentDetail } from "@/lib/hooks/useTournamentData";
import { TournamentDraft } from "@/components/TournamentDraft";
import { TournamentActive } from "@/components/TournamentActive";
import { TournamentCompleted } from "@/components/TournamentCompleted";
import { getGameEmoji } from "@/lib/games";
import type { Tournament } from "@/lib/schemas";

interface TournamentPageProps {
  locale: string;
  tournamentId: string;
}

interface TournamentInfoProps {
  tournament: Tournament;
  participantCount: number;
  locale: string;
}

function TournamentInfo({ tournament, participantCount, locale }: TournamentInfoProps) {
  const t = useTranslations();

  const modeIcons = {
    single_elim: "🏆",
    double_elim: "❤️❤️",
    ladder: "📊",
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  // Get game emoji
  const gameEmoji = tournament.game
    ? getGameEmoji(tournament.game.gameKey, tournament.game.customEmoji)
    : null;

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  };

  const getDateDisplay = (): string | null => {
    if (!tournament.startDate) return null;
    if (tournament.endDate && tournament.endDate !== tournament.startDate) {
      return `${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`;
    }
    return formatDate(tournament.startDate);
  };

  const dateDisplay = getDateDisplay();

  return (
    <div className="border-b border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50 dark:border-gray-800 dark:from-violet-950/20 dark:to-purple-950/20">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm dark:bg-gray-800">
            {gameEmoji || modeIcons[tournament.mode]}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tournament.name}
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tournament.status]}`}>
                {t("dashboard.status." + tournament.status)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                {modeIcons[tournament.mode]} {t("dashboard.mode." + tournament.mode)}
              </span>
              <span>
                {tournament.participantType === "pair"
                  ? t("dashboard.pairCount", { count: participantCount })
                  : t("dashboard.participantCount", { count: participantCount })}
              </span>
              {dateDisplay && (
                <span className="flex items-center gap-1">
                  📅 {dateDisplay}
                </span>
              )}
            </div>

            {tournament.game?.name && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                🎮 {tournament.game.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentPageContent({ locale, tournamentId }: TournamentPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { tournament, participants, matches, loading } = useTournamentDetail(tournamentId);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <AppHeader
          locale={locale}
          showBackButton
          backHref={`/${locale}/app`}
          currentPath="tournament"
        />
        <main className="flex-1">
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <AppHeader
          locale={locale}
          showBackButton
          backHref={`/${locale}/app`}
          currentPath="tournament"
        />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center">
            <div className="mb-4 text-5xl">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tournament not found
            </h2>
            <button
              onClick={() => router.push(`/${locale}/app`)}
              className="mt-4 text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {t("common.back")}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <AppHeader
        locale={locale}
        showBackButton
        backHref={`/${locale}/app`}
        currentPath="tournament"
      />
      <TournamentInfo
        tournament={tournament}
        participantCount={participants.length}
        locale={locale}
      />
      <main className="flex-1">
        {tournament.status === "draft" && (
          <TournamentDraft
            tournament={tournament}
            participants={participants}
          />
        )}
        {tournament.status === "active" && (
          <TournamentActive
            tournament={tournament}
            participants={participants}
            matches={matches}
            locale={locale}
          />
        )}
        {tournament.status === "completed" && (
          <TournamentCompleted
            tournament={tournament}
            matches={matches}
            participants={participants}
            participantMap={new Map(participants.map((p) => [p.id, p]))}
            locale={locale}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

// Main export with AuthGate wrapper
export function TournamentPage({ locale, tournamentId }: TournamentPageProps) {
  return (
    <AuthGate locale={locale}>
      <TournamentPageContent locale={locale} tournamentId={tournamentId} />
    </AuthGate>
  );
}
