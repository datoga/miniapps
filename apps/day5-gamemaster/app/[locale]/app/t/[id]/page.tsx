import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TournamentPage } from "./TournamentPage";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

// noindex for app routes
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function Page({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <TournamentPage locale={locale} tournamentId={id} />;
}

