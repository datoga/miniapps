"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Footer } from "@miniapps/ui";
import { LandingHeader } from "./LandingHeader";
import { trackNavClick } from "@/lib/ga";

interface LandingPageProps {
  locale: string;
}

export function LandingPage({ locale }: LandingPageProps) {
  const t = useTranslations();

  const handleNavClick = (destination: string) => {
    trackNavClick(destination, "landing_page");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <LandingHeader locale={locale} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <div className="text-center">
              <div className="mb-6 text-7xl">🏆</div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                {t("landing.hero.title")}
              </h1>
              <p className="mb-4 text-xl text-emerald-600 dark:text-emerald-400">
                {t("landing.hero.subtitle")}
              </p>
              <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
                {t("landing.hero.description")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href={`/${locale}/app`} onClick={() => handleNavClick("app")}>
                  <Button variant="primary" size="lg">
                    {t("landing.hero.cta")}
                  </Button>
                </Link>
                <Link href={`/${locale}/about`} onClick={() => handleNavClick("about")}>
                  <Button variant="outline" size="lg">
                    {t("landing.hero.learnMore")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-900/20" />
        </section>

        {/* Features Section */}
        <section className="border-t border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
              {t("landing.features.title")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon="🏅"
                title={t("landing.features.singleElim.title")}
                description={t("landing.features.singleElim.description")}
              />
              <FeatureCard
                icon="💔"
                title={t("landing.features.doubleElim.title")}
                description={t("landing.features.doubleElim.description")}
              />
              <FeatureCard
                icon="📊"
                title={t("landing.features.ladder.title")}
                description={t("landing.features.ladder.description")}
              />
              <FeatureCard
                icon="👥"
                title={t("landing.features.participants.title")}
                description={t("landing.features.participants.description")}
              />
              <FeatureCard
                icon="💾"
                title={t("landing.features.local.title")}
                description={t("landing.features.local.description")}
              />
              <FeatureCard
                icon="🎮"
                title={t("landing.features.games.title")}
                description={t("landing.features.games.description")}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
