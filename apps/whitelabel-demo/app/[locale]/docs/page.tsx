import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@miniapps/ui";
import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DocsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DocsContent locale={locale} />;
}

function DocsContent({ locale }: { locale: string }) {
  const t = useTranslations("docs");

  const sections = [
    {
      title: t("sections.structure.title"),
      items: [
        "apps/ - Mini apps individuales",
        "packages/ui - Componentes compartidos",
        "packages/i18n - Internacionalización",
        "packages/analytics - Google Analytics",
        "packages/storage - IndexedDB/localStorage",
      ],
    },
    {
      title: t("sections.commands.title"),
      items: [
        "pnpm install - Instalar dependencias",
        "pnpm dev - Iniciar desarrollo",
        "pnpm build - Construir para producción",
        "pnpm --filter <app> dev - Iniciar app específica",
      ],
    },
    {
      title: t("sections.i18n.title"),
      items: [
        "/es - Versión en español",
        "/en - English version",
        "messages/*.json - Archivos de traducción",
      ],
    },
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

      <div className="space-y-8">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
          >
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                >
                  <span className="text-primary-500">•</span>
                  <code className="text-sm">{item}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-center gap-4">
        <Link href={`/${locale}`}>
          <Button variant="outline">{t("backHome")}</Button>
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="primary">{t("viewGithub")}</Button>
        </a>
      </div>
    </div>
  );
}

