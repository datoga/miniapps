import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@miniapps/ui";
import { StorageDemo } from "@/components/StorageDemo";
import { FeatureCard } from "@/components/FeatureCard";
import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePageContent locale={locale} />;
}

function HomePageContent({ locale }: { locale: string }) {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          {t("app.title")}
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
          {t("app.subtitle")}
        </p>
        <p className="mx-auto mb-8 max-w-3xl text-gray-500 dark:text-gray-400">
          {t("app.description")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={`/${locale}/get-started`}>
            <Button variant="primary" size="lg">
              {t("app.cta.getStarted")}
            </Button>
          </Link>
          <Link href={`/${locale}/learn-more`}>
            <Button variant="outline" size="lg">
              {t("app.cta.learnMore")}
            </Button>
          </Link>
          <Link href={`/${locale}/docs`}>
            <Button variant="secondary" size="lg">
              {t("app.cta.viewDocs")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {t("features.title")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon="🌍"
            title={t("features.i18n.title")}
            description={t("features.i18n.description")}
          />
          <FeatureCard
            icon="🎨"
            title={t("features.theming.title")}
            description={t("features.theming.description")}
          />
          <FeatureCard
            icon="📊"
            title={t("features.analytics.title")}
            description={t("features.analytics.description")}
          />
          <FeatureCard
            icon="💾"
            title={t("features.storage.title")}
            description={t("features.storage.description")}
          />
        </div>
      </section>

      {/* Storage Demo Section */}
      <section id="demo" className="mb-16">
        <StorageDemo />
      </section>

      {/* Lorem Ipsum Section */}
      <section id="about" className="rounded-xl bg-gray-50 p-8 dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {t("demo.loremTitle")}
        </h2>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>{t("demo.loremParagraph1")}</p>
          <p>{t("demo.loremParagraph2")}</p>
          <p>{t("demo.loremParagraph3")}</p>
        </div>
      </section>
    </div>
  );
}
