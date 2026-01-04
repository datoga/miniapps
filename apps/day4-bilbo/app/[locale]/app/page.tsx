import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AppHome } from "@/components/AppHome";

type PageProps = {
  params: Promise<{ locale: string }>;
};

// noindex for app routes
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function AppHomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AppHome locale={locale} />;
}

