import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { RecorderApp } from "@/components/RecorderApp";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <>
      {/* Server-rendered landing content for SEO */}
      <section className="px-4 py-8 sm:py-12 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t("heading")}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          {t("subheading")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t("features.private")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("features.privateDesc")}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t("features.unlimited")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("features.unlimitedDesc")}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t("features.formats")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("features.formatsDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Client-side recorder app */}
      <RecorderApp />
    </>
  );
}
