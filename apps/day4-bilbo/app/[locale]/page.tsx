import { setRequestLocale } from "next-intl/server";
import { LandingPage } from "@/components/LandingPage";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage locale={locale} />;
}

