import { TournamentTVPage } from "./TournamentTVPage";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  return <TournamentTVPage locale={locale} tournamentId={id} />;
}

