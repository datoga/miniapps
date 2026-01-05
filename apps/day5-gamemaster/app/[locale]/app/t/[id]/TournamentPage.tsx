"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Footer } from "@miniapps/ui";
import { AppHeader } from "@/components/AppHeader";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";
import { useTournamentDetail } from "@/lib/hooks/useTournamentData";
import { TournamentDraft } from "@/components/TournamentDraft";
import { TournamentActive } from "@/components/TournamentActive";
import { TournamentCompleted } from "@/components/TournamentCompleted";

// TV Mode Button Component
function TVModeButton({ href }: { href: string }) {
  const t = useTranslations();
  return (
    <Link
      href={href}
      target="_blank"
      className="hidden items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 sm:flex dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      title={t("tournament.tv.mode")}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span>TV</span>
    </Link>
  );
}

interface TournamentPageProps {
  locale: string;
  tournamentId: string;
}

export function TournamentPage({ locale, tournamentId }: TournamentPageProps) {
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
          rightContent={<SyncStatusIndicator />}
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
          rightContent={<SyncStatusIndicator />}
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
        rightContent={
          <div className="flex items-center gap-2">
            {tournament.status !== "draft" && (
              <TVModeButton href={`/${locale}/app/t/${tournamentId}/tv`} />
            )}
            <SyncStatusIndicator />
          </div>
        }
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

