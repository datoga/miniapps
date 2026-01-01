import { setRequestLocale } from "next-intl/server";
import { Dashboard } from "../../components/Dashboard";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Dashboard />;
}
