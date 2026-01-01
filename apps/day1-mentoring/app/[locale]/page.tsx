import { setRequestLocale } from "next-intl/server";
import { LandingPage } from "../../components/LandingPage";
import { AppShellWrapper } from "../../components/AppShellWrapper";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AppShellWrapper currentPath="landing">
      <LandingPage />
    </AppShellWrapper>
  );
}
