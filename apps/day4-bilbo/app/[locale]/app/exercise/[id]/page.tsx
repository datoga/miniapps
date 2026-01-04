import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ExerciseDetail } from "@/components/ExerciseDetail";

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

export default async function ExercisePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ExerciseDetail locale={locale} exerciseId={id} />;
}

