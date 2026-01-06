"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";

export const UnsupportedScreen = memo(function UnsupportedScreen() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-6xl">🚫</div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        {t("unsupported.title")}
      </h1>
      <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
        {t("unsupported.description")}
      </p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("unsupported.supportedBrowsers")}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("unsupported.browsers")}
        </p>
      </div>
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
        {t("unsupported.tip")}
      </p>
    </div>
  );
});

