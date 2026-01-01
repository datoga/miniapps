import { setRequestLocale } from "next-intl/server";
import { AboutSection } from "../../../components/AboutSection";
import { AppShellWrapper } from "../../../components/AppShellWrapper";

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

