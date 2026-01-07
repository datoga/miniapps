"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

type Props = {
  locale: string;
};

export function BackToSearch({ locale }: Props) {
  const t = useTranslations("profession");

  return (
    <Link
      href={`/${locale}`}
      className="inline-flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors mb-6"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {t("backToSearch")}
    </Link>
  );
}


