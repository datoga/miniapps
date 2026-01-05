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

interface TournamentPageProps {
  locale: string;
  tournamentId: string;
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
        title={tournament.name}
        currentPath="tournament"
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
