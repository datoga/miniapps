import { setRequestLocale } from "next-intl/server";
import { Header, Footer } from "@miniapps/ui";
import { LandingHero } from "@/components/LandingHero";
import { ProfessionSearch } from "@/components/ProfessionSearch";
import { FeaturesSection } from "@/components/FeaturesSection";
import { AboutSection } from "@/components/AboutSection";
import { RandomProfession } from "@/components/RandomProfession";
import { BrandTitle } from "@/components/BrandTitle";
import { getProfessionCount } from "@/lib/professions/load.server";

export const dynamic = "force-static";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const professionCount = getProfessionCount();

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={<BrandTitle />} />

      <main className="flex-1">
        {/* Hero Section */}
        <LandingHero />

        {/* Search Section */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto">
            <ProfessionSearch
              locale={locale as "en" | "es"}
              professionCount={professionCount}
            />

            {/* Random Profession */}
            <div className="mt-8">
              <RandomProfession locale={locale as "en" | "es"} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <FeaturesSection />

        {/* About Section */}
        <AboutSection />
      </main>

      <Footer />
    </div>
  );
}

