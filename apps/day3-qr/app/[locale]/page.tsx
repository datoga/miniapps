import { setRequestLocale } from "next-intl/server";
import { QRKitApp } from "../../components/QRKitApp";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <QRKitApp />;
}
