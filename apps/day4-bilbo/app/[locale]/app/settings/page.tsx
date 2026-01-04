import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SettingsPage } from "@/components/SettingsPage";

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

export default async function Settings({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SettingsPage locale={locale} />;
}

