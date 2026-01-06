import { setRequestLocale } from "next-intl/server";
import { RecorderApp } from "@/components/RecorderApp";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecorderApp />;
}
