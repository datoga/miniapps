import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@miniapps/ui";
import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LearnMorePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LearnMoreContent locale={locale} />;
}

function LearnMoreContent({ locale }: { locale: string }) {
  const t = useTranslations("learnMore");

  const features = [
    { icon: "🚀", title: t("features.turborepo.title"), description: t("features.turborepo.description") },
    { icon: "🌐", title: t("features.i18n.title"), description: t("features.i18n.description") },
    { icon: "🎨", title: t("features.themes.title"), description: t("features.themes.description") },
    { icon: "📊", title: t("features.analytics.title"), description: t("features.analytics.description") },
    { icon: "💾", title: t("features.storage.title"), description: t("features.storage.description") },
    { icon: "☁️", title: t("features.vercel.title"), description: t("features.vercel.description") },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-3 text-3xl">{feature.icon}</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href={`/${locale}`}>
          <Button variant="outline">{t("backHome")}</Button>
        </Link>
      </div>
    </div>
  );
}

