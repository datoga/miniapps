import { setRequestLocale } from "next-intl/server";
import { AppShellWrapper } from "../../../components/AppShellWrapper";
import { AboutSection } from "../../../components/AboutSection";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AppShellWrapper currentPath="about">
      <AboutSection />
    </AppShellWrapper>
  );
}

