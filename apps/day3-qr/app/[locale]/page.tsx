import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePageContent />;
}

function HomePageContent() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 text-6xl">🚧</div>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        {t("app.title")}
      </h1>
      <p className="mb-6 text-xl text-gray-600 dark:text-gray-300">
        {t("common.comingSoon")}
      </p>
      <p className="max-w-md text-gray-500 dark:text-gray-400">
        {t("common.comingSoonDescription")}
      </p>
    </div>
  );
}

