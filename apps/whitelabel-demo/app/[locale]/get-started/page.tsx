import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@miniapps/ui";
import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GetStartedPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GetStartedContent locale={locale} />;
}

function GetStartedContent({ locale }: { locale: string }) {
  const t = useTranslations("getStarted");

  const steps = [
    { number: "01", title: t("steps.clone.title"), description: t("steps.clone.description") },
    { number: "02", title: t("steps.install.title"), description: t("steps.install.description") },
    { number: "03", title: t("steps.run.title"), description: t("steps.run.description") },
    {
      number: "04",
      title: t("steps.customize.title"),
      description: t("steps.customize.description"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">{t("subtitle")}</p>
      </div>

      <div className="space-y-8">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex gap-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              {step.number}
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
            </div>
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
